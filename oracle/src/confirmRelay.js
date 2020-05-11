require('../env')
const path = require('path')
const { connectWatcherToQueue, connection } = require('./services/amqpClient')
const logger = require('./services/logger')
const rpcUrlsManager = require('./services/getRpcUrlsManager')
const { getEventsFromTx } = require('./tx/web3')
const { checkHTTPS, watchdog } = require('./utils/utils')
const { EXIT_CODES } = require('./utils/constants')

if (process.argv.length < 5) {
  logger.error('Please check the number of arguments, transaction hash is not present')
  process.exit(EXIT_CODES.GENERAL_ERROR)
}

const config = require(path.join('../config/', process.argv[2]))
const txHash = process.argv[4]

const processSignatureRequests = require('./events/processSignatureRequests')(config)
const processCollectedSignatures = require('./events/processCollectedSignatures')(config)
const processAffirmationRequests = require('./events/processAffirmationRequests')(config)
const processTransfers = require('./events/processTransfers')(config)
const processAMBSignatureRequests = require('./events/processAMBSignatureRequests')(config)
const processAMBCollectedSignatures = require('./events/processAMBCollectedSignatures')(config)
const processAMBAffirmationRequests = require('./events/processAMBAffirmationRequests')(config)

const { getTokensState } = require('./utils/tokenState')

const web3Instance = config.web3
const bridgeContract = new web3Instance.eth.Contract(config.bridgeAbi, config.bridgeContractAddress)
let { eventContractAddress } = config
let eventContract = new web3Instance.eth.Contract(config.eventAbi, eventContractAddress)

async function initialize() {
  try {
    const checkHttps = checkHTTPS(process.env.ORACLE_ALLOW_HTTP_FOR_RPC, logger)

    rpcUrlsManager.homeUrls.forEach(checkHttps('home'))
    rpcUrlsManager.foreignUrls.forEach(checkHttps('foreign'))

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
    if (connection.isConnected()) {
      if (config.maxProcessingTime) {
        await watchdog(() => main({ sendToQueue, sendToWorker, txHash }), config.maxProcessingTime, () => {
          logger.fatal('Max processing time reached')
          process.exit(EXIT_CODES.MAX_TIME_REACHED)
        })
      } else {
        await main({ sendToQueue, sendToWorker, txHash })
      }
    } else {
      setTimeout(() => {
        runMain({ sendToQueue, sendToWorker })
      }, config.pollingInterval)
    }
  } catch (e) {
    logger.error(e)
  }
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
    case 'erc-native-half-duplex-transfer':
      logger.debug('Getting Half Duplex token address to listen Transfer events')
      state = await getTokensState(bridgeContract, logger)
      updateEventContract(state.halfDuplexTokenAddress)
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

async function main({ sendToQueue, txHash }) {
  try {
    await checkConditions()

    const events = await getEventsFromTx({
      web3: web3Instance,
      contract: eventContract,
      event: config.event,
      txHash,
      filter: config.eventFilter
    })
    logger.info(`Found ${events.length} ${config.event} events`)

    if (events.length) {
      const job = await processEvents(events)
      logger.info('Transactions to send:', job.length)

      if (job.length) {
        await sendToQueue(job)
      }
    }
  } catch (e) {
    logger.error(e)
  }

  await connection.close()

  logger.debug('Finished')
}

initialize()
