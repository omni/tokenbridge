require('../env')
const path = require('path')
const { BN, toBN } = require('web3').utils
const { connectWatcherToQueue, connection } = require('./services/amqpClient')
const { getBlockNumber } = require('./tx/web3')
const { redis } = require('./services/redisClient')
const logger = require('./services/logger')
const { getRequiredBlockConfirmations, getEvents } = require('./tx/web3')
const { checkHTTPS, watchdog } = require('./utils/utils')
const { EXIT_CODES } = require('./utils/constants')
const { isChaiTokenEnabled } = require('./utils/chaiUtils')

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

const { getTokensState } = require('./utils/tokenState')

const ZERO = toBN(0)
const ONE = toBN(1)

const web3Instance = config.web3
const bridgeContract = new web3Instance.eth.Contract(config.bridgeAbi, config.bridgeContractAddress)
let { eventContractAddress } = config
let eventContract = new web3Instance.eth.Contract(config.eventAbi, eventContractAddress)
const lastBlockRedisKey = `${config.id}:lastProcessedBlock`
let lastProcessedBlock = BN.max(config.startBlock.sub(ONE), ZERO)

async function initialize() {
  try {
    const checkHttps = checkHTTPS(process.env.ORACLE_ALLOW_HTTP_FOR_RPC, logger)

    web3Instance.currentProvider.urls.forEach(checkHttps(config.chain))

    await getLastProcessedBlock()
    connectWatcherToQueue({
      queueName: config.queue,
      workerQueue: config.workerQueue,
      cb: runMain
    })
  } catch (e) {
    logger.error(e)
    process.exit(EXIT_CODES.GENERAL_ERROR)
  }
}

async function runMain({ sendToQueue, sendToWorker }) {
  try {
    if (connection.isConnected() && redis.status === 'ready') {
      if (config.maxProcessingTime) {
        await watchdog(() => main({ sendToQueue, sendToWorker }), config.maxProcessingTime, () => {
          logger.fatal('Max processing time reached')
          process.exit(EXIT_CODES.MAX_TIME_REACHED)
        })
      } else {
        await main({ sendToQueue, sendToWorker })
      }
    }
  } catch (e) {
    logger.error(e)
  }

  setTimeout(() => {
    runMain({ sendToQueue, sendToWorker })
  }, config.pollingInterval)
}

async function getLastProcessedBlock() {
  const result = await redis.get(lastBlockRedisKey)
  logger.debug({ fromRedis: result, fromConfig: lastProcessedBlock.toString() }, 'Last Processed block obtained')
  lastProcessedBlock = result ? toBN(result) : lastProcessedBlock
}

function updateLastProcessedBlock(lastBlockNumber) {
  lastProcessedBlock = lastBlockNumber
  return redis.set(lastBlockRedisKey, lastProcessedBlock.toString())
}

function processEvents(events) {
  switch (config.id) {
    case 'native-erc-signature-request':
    case 'erc-erc-signature-request':
    case 'erc-native-signature-request':
      return processSignatureRequests(events)
    case 'native-erc-collected-signatures':
    case 'erc-erc-collected-signatures':
    case 'erc-native-collected-signatures':
      return processCollectedSignatures(events)
    case 'native-erc-affirmation-request':
    case 'erc677-erc677-affirmation-request':
    case 'erc-native-affirmation-request':
    case 'erc-erc-affirmation-request':
      return processAffirmationRequests(events)
    case 'erc-erc-transfer':
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
      updateEventContract(state.bridgeableTokenAddress)
      break
    default:
  }
}

function updateEventContract(address) {
  if (eventContractAddress !== address) {
    eventContractAddress = address
    eventContract = new web3Instance.eth.Contract(config.eventAbi, eventContractAddress)
  }
}

async function getLastBlockToProcess() {
  const lastBlockNumberPromise = getBlockNumber(web3Instance).then(toBN)
  const requiredBlockConfirmationsPromise = getRequiredBlockConfirmations(bridgeContract).then(toBN)
  const [lastBlockNumber, requiredBlockConfirmations] = await Promise.all([
    lastBlockNumberPromise,
    requiredBlockConfirmationsPromise
  ])

  return lastBlockNumber.sub(requiredBlockConfirmations)
}

async function isWorkerNeeded() {
  switch (config.id) {
    case 'erc-native-transfer':
      return isChaiTokenEnabled(bridgeContract, logger)
    default:
      return true
  }
}

async function main({ sendToQueue, sendToWorker }) {
  try {
    await checkConditions()

    const lastBlockToProcess = await getLastBlockToProcess()

    if (lastBlockToProcess.lte(lastProcessedBlock)) {
      logger.debug('All blocks already processed')
      return
    }

    const fromBlock = lastProcessedBlock.add(ONE)
    const toBlock = lastBlockToProcess

    const events = await getEvents({
      contract: eventContract,
      event: config.event,
      fromBlock,
      toBlock,
      filter: config.eventFilter
    })
    logger.info(`Found ${events.length} ${config.event} events`)

    if (events.length) {
      if (sendToWorker && (await isWorkerNeeded())) {
        await sendToWorker({ blockNumber: toBlock.toString() })
      }

      const job = await processEvents(events)
      logger.info('Transactions to send:', job.length)

      if (job.length) {
        await sendToQueue(job)
      }
    }

    logger.debug({ lastProcessedBlock: lastBlockToProcess.toString() }, 'Updating last processed block')
    await updateLastProcessedBlock(lastBlockToProcess)
  } catch (e) {
    logger.error(e)
  }

  logger.debug('Finished')
}

initialize()
