require('../env')
const path = require('path')
const { connectWatcherToQueue, connection } = require('./services/amqpClient')
const { redis } = require('./services/redisClient')
const logger = require('./services/logger')
const { getShutdownFlag } = require('./services/shutdownState')
const { getBlock, getBlockNumber, getRequiredBlockConfirmations, getEvents } = require('./tx/web3')
const { checkHTTPS, watchdog } = require('./utils/utils')
const { EXIT_CODES } = require('./utils/constants')

if (process.argv.length < 3) {
  logger.error('Please check the number of arguments, config file was not provided')
  process.exit(EXIT_CODES.GENERAL_ERROR)
}

const config = require(path.join('../config/', process.argv[2]))

const processSignatureRequests = require('./events/processSignatureRequests')(config)
const processCollectedSignatures = require('./events/processCollectedSignatures')(config)
const processAffirmationRequests = require('./events/processAffirmationRequests')(config)
const processTransfers = require('./events/processTransfers')(config)
const processAMBSignatureRequests = require('./events/processAMBSignatureRequests')(config)
const processAMBCollectedSignatures = require('./events/processAMBCollectedSignatures')(config)
const processAMBAffirmationRequests = require('./events/processAMBAffirmationRequests')(config)
const processAMBInformationRequests = require('./events/processAMBInformationRequests')(config)

const { getTokensState } = require('./utils/tokenState')

const { web3, bridgeContract, eventContract, startBlock, pollingInterval, chain } = config.main
const lastBlockRedisKey = `${config.id}:lastProcessedBlock`
let lastProcessedBlock = Math.max(startBlock - 1, 0)
let nextPollingInterval = pollingInterval

async function initialize() {
  try {
    const checkHttps = checkHTTPS(process.env.ORACLE_ALLOW_HTTP_FOR_RPC, logger)

    web3.currentProvider.urls.forEach(checkHttps(chain))

    await getLastProcessedBlock()
    connectWatcherToQueue({
      queueName: config.queue,
      cb: runMain
    })
  } catch (e) {
    logger.error(e)
    process.exit(EXIT_CODES.GENERAL_ERROR)
  }
}

async function runMain({ sendToQueue }) {
  try {
    if (connection.isConnected() && redis.status === 'ready') {
      if (config.maxProcessingTime) {
        await watchdog(() => main({ sendToQueue }), config.maxProcessingTime, () => {
          logger.fatal('Max processing time reached')
          process.exit(EXIT_CODES.MAX_TIME_REACHED)
        })
      } else {
        await main({ sendToQueue })
      }
    }
  } catch (e) {
    logger.error(e)
  }

  setTimeout(() => {
    runMain({ sendToQueue })
  }, nextPollingInterval)
  nextPollingInterval = pollingInterval
}

async function getLastProcessedBlock() {
  const result = await redis.get(lastBlockRedisKey)
  logger.debug({ fromRedis: result, fromConfig: lastProcessedBlock }, 'Last Processed block obtained')
  lastProcessedBlock = result ? parseInt(result, 10) : lastProcessedBlock
}

function updateLastProcessedBlock(lastBlockNumber) {
  lastProcessedBlock = lastBlockNumber
  return redis.set(lastBlockRedisKey, lastProcessedBlock)
}

function processEvents(events) {
  switch (config.id) {
    case 'erc-native-signature-request':
      return processSignatureRequests(events)
    case 'erc-native-collected-signatures':
      return processCollectedSignatures(events)
    case 'erc-native-affirmation-request':
      return processAffirmationRequests(events)
    case 'erc-native-transfer':
      return processTransfers(events)
    case 'amb-signature-request':
      return processAMBSignatureRequests(events)
    case 'amb-collected-signatures':
      return processAMBCollectedSignatures(events)
    case 'amb-affirmation-request':
      return processAMBAffirmationRequests(events)
    default:
      return []
  }
}

async function checkConditions() {
  let state
  switch (config.id) {
    case 'erc-native-transfer':
      logger.debug('Getting token address to listen Transfer events')
      state = await getTokensState(bridgeContract, logger)
      eventContract.options.address = state.bridgeableTokenAddress
      break
    default:
  }
}

async function getLastBlockToProcess(web3, bridgeContract) {
  const [lastBlockNumber, requiredBlockConfirmations] = await Promise.all([
    getBlockNumber(web3),
    getRequiredBlockConfirmations(bridgeContract)
  ])
  return lastBlockNumber - requiredBlockConfirmations
}

async function main({ sendToQueue }) {
  try {
    const wasShutdown = await getShutdownFlag(logger, config.shutdownKey, false)
    if (await getShutdownFlag(logger, config.shutdownKey, true)) {
      if (!wasShutdown) {
        logger.info('Oracle watcher was suspended via the remote shutdown process')
      }
      return
    } else if (wasShutdown) {
      logger.info(`Oracle watcher was unsuspended.`)
    }

    await checkConditions()

    let lastBlockToProcess = await getLastBlockToProcess(web3, bridgeContract)

    if (lastBlockToProcess <= lastProcessedBlock) {
      logger.debug('All blocks already processed')
      return
    }

    const fromBlock = lastProcessedBlock + 1
    const rangeEndBlock = config.blockPollingLimit ? fromBlock + config.blockPollingLimit : lastBlockToProcess
    const toBlock = Math.min(lastBlockToProcess, rangeEndBlock)

    let events = await getEvents({
      contract: eventContract,
      event: config.event,
      fromBlock,
      toBlock,
      filter: config.eventFilter
    })
    logger.info(`Found ${events.length} ${config.event} events`)

    if (events.length) {
      let job

      // for async information requests, requests are processed in batches only if they are located in the same block
      // this brings two benefits:
      // 1) corresponding foreign block for specific timestamp is searched only once per events batch
      // 2) watcher can carefully wait until corresponding foreign block has enough confirmations
      if (config.id === 'amb-information-request') {
        const { foreign } = config

        events = events.sort(event => event.blockNumber)
        const batchBlockNumber = events[0].blockNumber
        const nextBatchBlockNumber = events.find(event => event.blockNumber > batchBlockNumber)
        lastBlockToProcess = nextBatchBlockNumber ? nextBatchBlockNumber - 1 : batchBlockNumber
        events = events.filter(event => event.blockNumber === batchBlockNumber)

        const lastForeignBlockNumber = await getLastBlockToProcess(foreign.web3, foreign.bridgeContract)
        const lastForeignBlock = await getBlock(foreign.web3, lastForeignBlockNumber)

        const remainingDelay = events[0].returnValues.timestamp - lastForeignBlock.timestamp
        if (remainingDelay > 0) {
          logger.debug(`Not enough foreign block confirmations, waiting ${remainingDelay} seconds`)
          nextPollingInterval = Math.max(pollingInterval, remainingDelay * 1000)
          return
        }

        job = await processAMBInformationRequests(events, lastForeignBlock)
      } else {
        job = await processEvents(events)
      }
      logger.info('Transactions to send:', job.length)

      if (job.length) {
        await sendToQueue(job)
      }
    }

    logger.debug({ lastProcessedBlock: toBlock.toString() }, 'Updating last processed block')
    await updateLastProcessedBlock(toBlock)
  } catch (e) {
    logger.error(e)
  }

  logger.debug('Finished')
}

initialize()
