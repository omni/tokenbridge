require('../env')
const path = require('path')
const { isAttached, connectWatcherToQueue, connection } = require('./services/amqpClient')
const logger = require('./services/logger')
const GasPrice = require('./services/gasPrice')
const { getNonce, getChainId, getEventsFromTx, getBlock } = require('./tx/web3')
const { sendTx } = require('./tx/sendTx')
const { checkHTTPS, watchdog, syncForEach, addExtraGas } = require('./utils/utils')
const { EXIT_CODES, EXTRA_GAS_PERCENTAGE, MAX_GAS_LIMIT } = require('./utils/constants')

const { ORACLE_VALIDATOR_ADDRESS, ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY, ORACLE_ALLOW_HTTP_FOR_RPC } = process.env

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
const processAMBInformationRequests = require('./events/processAMBInformationRequests')(config)

const { web3, eventContract } = config.main

let attached

async function initialize() {
  try {
    const checkHttps = checkHTTPS(ORACLE_ALLOW_HTTP_FOR_RPC, logger)

    web3.currentProvider.urls.forEach(checkHttps(config.chain))

    attached = await isAttached()
    if (attached) {
      logger.info('RabbitMQ container is available, using oracle sender')
    } else {
      logger.info('RabbitMQ container is not available, using internal sender')
    }

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
    const sendJob = attached ? sendToQueue : sendJobTx
    if (!attached || connection.isConnected()) {
      if (config.maxProcessingTime) {
        await watchdog(() => main({ sendJob, txHash }), config.maxProcessingTime, () => {
          logger.fatal('Max processing time reached')
          process.exit(EXIT_CODES.MAX_TIME_REACHED)
        })
      } else {
        await main({ sendJob, txHash })
      }
    } else {
      setTimeout(() => {
        runMain({ sendToQueue })
      }, config.pollingInterval)
    }
  } catch (e) {
    logger.error(e)
  }
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

async function main({ sendJob, txHash }) {
  try {
    const events = await getEventsFromTx({
      web3,
      contract: eventContract,
      event: config.event,
      txHash,
      filter: config.eventFilter
    })
    logger.info(`Found ${events.length} ${config.event} events`)

    if (events.length) {
      let job

      if (config.id === 'amb-information-request') {
        const { foreign } = config

        const batchTimestamp = events[0].returnValues.timestamp

        // obtain last block on the foreign side
        const lastForeignBlock = await getBlock(foreign.web3, 'latest')

        if (batchTimestamp > lastForeignBlock.timestamp) {
          logger.debug(`Not enough foreign block confirmations`)
          return
        }

        job = await processAMBInformationRequests(events, lastForeignBlock)
      } else {
        job = await processEvents(events)
      }
      logger.info('Transactions to send:', job.length)

      if (job.length) {
        await sendJob(job)
      }
    }
  } catch (e) {
    logger.error(e)
  }

  await connection.close()

  logger.debug('Finished')
}

async function sendJobTx(jobs) {
  const gasPrice = await GasPrice.start(config.chain, true)
  const chainId = await getChainId(web3)
  let nonce = await getNonce(web3, ORACLE_VALIDATOR_ADDRESS)

  await syncForEach(jobs, async job => {
    let gasLimit
    if (typeof job.extraGas === 'number') {
      gasLimit = addExtraGas(job.gasEstimate + job.extraGas, 0, MAX_GAS_LIMIT)
    } else {
      gasLimit = addExtraGas(job.gasEstimate, EXTRA_GAS_PERCENTAGE, MAX_GAS_LIMIT)
    }

    try {
      logger.info(`Sending transaction with nonce ${nonce}`)
      const txHash = await sendTx({
        data: job.data,
        nonce,
        gasPrice: gasPrice.toString(10),
        amount: '0',
        gasLimit,
        privateKey: ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY,
        to: job.to,
        chainId,
        web3
      })

      nonce++
      logger.info(
        { eventTransactionHash: job.transactionReference, generatedTransactionHash: txHash },
        `Tx generated ${txHash} for event Tx ${job.transactionReference}`
      )
    } catch (e) {
      logger.error(
        { eventTransactionHash: job.transactionReference, error: e.message },
        `Tx Failed for event Tx ${job.transactionReference}.`,
        e.message
      )

      if (e.message.toLowerCase().includes('insufficient funds')) {
        const currentBalance = await web3.eth.getBalance(ORACLE_VALIDATOR_ADDRESS)
        const minimumBalance = gasLimit.multipliedBy(gasPrice)
        logger.error(
          `Insufficient funds: ${currentBalance}. Stop processing messages until the balance is at least ${minimumBalance}.`
        )
      }
    }
  })
}

initialize()
