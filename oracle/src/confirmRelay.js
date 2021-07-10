require('../env')
const path = require('path')
const fs = require('fs')
const { isAttached, connectWatcherToQueue, connection } = require('./services/amqpClient')
const logger = require('./services/logger')
const GasPrice = require('./services/gasPrice')
const { getNonce, getChainId, getEventsFromTx } = require('./tx/web3')
const { sendTx } = require('./tx/sendTx')
const { checkHTTPS, watchdog, syncForEach, addExtraGas } = require('./utils/utils')
const { EXIT_CODES, EXTRA_GAS_PERCENTAGE, MAX_GAS_LIMIT } = require('./utils/constants')

const { ORACLE_ALLOW_HTTP_FOR_RPC } = process.env

if (process.argv.length < 4) {
  logger.error('Please check the number of arguments, transaction hash is not present')
  process.exit(EXIT_CODES.GENERAL_ERROR)
}

const config = require(path.join('../config/', process.argv[2]))
const { web3, eventContract, chain } = config.main

const isTxHash = txHash => txHash.length === 66 && web3.utils.isHexStrict(txHash)
function readTxHashes(filePath) {
  return fs
    .readFileSync(filePath)
    .toString()
    .split('\n')
    .map(v => v.trim())
    .filter(isTxHash)
}

const txHashesArgs = process.argv.slice(3)
const rawTxHashes = txHashesArgs.filter(isTxHash)
const txHashesFiles = txHashesArgs.filter(path => fs.existsSync(path)).flatMap(readTxHashes)
const txHashes = [...rawTxHashes, ...txHashesFiles]

const processSignatureRequests = require('./events/processSignatureRequests')(config)
const processCollectedSignatures = require('./events/processCollectedSignatures')(config)
const processAffirmationRequests = require('./events/processAffirmationRequests')(config)
const processTransfers = require('./events/processTransfers')(config)
const processAMBSignatureRequests = require('./events/processAMBSignatureRequests')(config)
const processAMBCollectedSignatures = require('./events/processAMBCollectedSignatures')(config)
const processAMBAffirmationRequests = require('./events/processAMBAffirmationRequests')(config)
const processAMBInformationRequests = require('./events/processAMBInformationRequests')(config)

let attached

async function initialize() {
  try {
    const checkHttps = checkHTTPS(ORACLE_ALLOW_HTTP_FOR_RPC, logger)

    web3.currentProvider.subProvider.urls.forEach(checkHttps(chain))

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
        await watchdog(() => main({ sendJob, txHashes }), config.maxProcessingTime, () => {
          logger.fatal('Max processing time reached')
          process.exit(EXIT_CODES.MAX_TIME_REACHED)
        })
      } else {
        await main({ sendJob, txHashes })
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
    case 'amb-information-request':
      return processAMBInformationRequests(events)
    default:
      return []
  }
}

async function main({ sendJob, txHashes }) {
  logger.info(`Processing ${txHashes.length} input transactions`)
  for (const txHash of txHashes) {
    try {
      logger.info({ txHash }, `Processing transaction`)
      const events = await getEventsFromTx({
        web3,
        contract: eventContract,
        event: config.event,
        txHash,
        filter: config.eventFilter
      })
      logger.info({ txHash }, `Found ${events.length} ${config.event} events`)

      if (events.length) {
        const job = await processEvents(events)
        logger.info({ txHash }, 'Transactions to send:', job.length)

        if (job.length) {
          await sendJob(job)
        }
      }
    } catch (e) {
      logger.error(e)
    }
  }

  await connection.close()

  logger.debug('Finished')
}

async function sendJobTx(jobs) {
  await GasPrice.start(chain, true)
  const gasPrice = GasPrice.getPrice().toString(10)

  const { web3 } = config.sender === 'foreign' ? config.foreign : config.home

  const chainId = await getChainId(web3)
  let nonce = await getNonce(web3, config.validatorAddress)

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
        gasPrice,
        amount: '0',
        gasLimit,
        privateKey: config.validatorPrivateKey,
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
        const currentBalance = await web3.eth.getBalance(config.validatorAddress)
        const minimumBalance = gasLimit.multipliedBy(gasPrice)
        logger.error(
          `Insufficient funds: ${currentBalance}. Stop processing messages until the balance is at least ${minimumBalance}.`
        )
      }
    }
  })
}

initialize()
