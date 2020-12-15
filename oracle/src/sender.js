require('../env')
const path = require('path')
const { connectSenderToQueue } = require('./services/amqpClient')
const { redis } = require('./services/redisClient')
const GasPrice = require('./services/gasPrice')
const logger = require('./services/logger')
const { sendTx } = require('./tx/sendTx')
const { getNonce, getChainId } = require('./tx/web3')
const {
  addExtraGas,
  checkHTTPS,
  privateKeyToAddress,
  syncForEach,
  waitForFunds,
  watchdog,
  nonceError
} = require('./utils/utils')
const { EXIT_CODES, EXTRA_GAS_PERCENTAGE, MAX_GAS_LIMIT } = require('./utils/constants')

const { ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY, ORACLE_TX_REDUNDANCY } = process.env

const ORACLE_VALIDATOR_ADDRESS = privateKeyToAddress(ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY)

if (process.argv.length < 3) {
  logger.error('Please check the number of arguments, config file was not provided')
  process.exit(EXIT_CODES.GENERAL_ERROR)
}

const config = require(path.join('../config/', process.argv[2]))

const web3Instance = config.web3
const web3Redundant = ORACLE_TX_REDUNDANCY === 'true' ? config.web3Redundant : config.web3
const { web3Fallback } = config

const nonceKey = `${config.id}:nonce`
let chainId = 0

async function initialize() {
  try {
    const checkHttps = checkHTTPS(process.env.ORACLE_ALLOW_HTTP_FOR_RPC, logger)

    web3Instance.currentProvider.urls.forEach(checkHttps(config.chain))

    GasPrice.start(config.id)

    chainId = await getChainId(web3Instance)
    connectSenderToQueue({
      queueName: config.queue,
      oldQueueName: config.oldQueue,
      cb: options => {
        if (config.maxProcessingTime) {
          return watchdog(() => main(options), config.maxProcessingTime, () => {
            logger.fatal('Max processing time reached')
            process.exit(EXIT_CODES.MAX_TIME_REACHED)
          })
        }

        return main(options)
      }
    })
  } catch (e) {
    logger.error(e.message)
    process.exit(EXIT_CODES.GENERAL_ERROR)
  }
}

function resume(newBalance) {
  logger.info(`Validator balance changed. New balance is ${newBalance}. Resume messages processing.`)
  initialize()
}

async function readNonce(forceUpdate) {
  logger.debug('Reading nonce')
  if (forceUpdate) {
    logger.debug('Forcing update of nonce')
    return getNonce(web3Instance, ORACLE_VALIDATOR_ADDRESS)
  }

  const nonce = await redis.get(nonceKey)
  if (nonce) {
    logger.debug({ nonce }, 'Nonce found in the DB')
    return Number(nonce)
  } else {
    logger.warn("Nonce wasn't found in the DB")
    return getNonce(web3Instance, ORACLE_VALIDATOR_ADDRESS)
  }
}

function updateNonce(nonce) {
  if (typeof nonce !== 'number') {
    logger.warn('Given nonce value is not a valid number. Nothing will be updated in the DB.')
  } else {
    redis.set(nonceKey, nonce)
  }
}

async function main({ msg, ackMsg, nackMsg, channel, scheduleForRetry, scheduleTransactionResend }) {
  try {
    if (redis.status !== 'ready') {
      nackMsg(msg)
      return
    }

    const txArray = JSON.parse(msg.content)
    logger.debug(`Msg received with ${txArray.length} Tx to send`)
    const gasPrice = GasPrice.getPrice().toString(10)

    let nonce
    let insufficientFunds = false
    let minimumBalance = null
    const failedTx = []
    const resendJobs = []

    const isResend = txArray.length > 0 && !!txArray[0].txHash

    if (isResend) {
      logger.info(`Checking status of ${txArray.length} transactions`)
      nonce = null
    } else {
      logger.info(`Sending ${txArray.length} transactions`)
      nonce = await readNonce()
    }
    await syncForEach(txArray, async job => {
      let gasLimit
      if (typeof job.extraGas === 'number') {
        gasLimit = addExtraGas(job.gasEstimate + job.extraGas, 0, MAX_GAS_LIMIT)
      } else {
        gasLimit = addExtraGas(job.gasEstimate, EXTRA_GAS_PERCENTAGE, MAX_GAS_LIMIT)
      }

      try {
        if (isResend) {
          const tx = await web3Fallback.eth.getTransaction(job.txHash)

          if (tx && tx.blockNumber !== null) {
            logger.debug(`Transaction ${job.txHash} was successfully mined`)
            return
          }

          if (nonce === null) {
            nonce = await readNonce(true)
          }

          logger.info(`Transaction ${job.txHash} was not mined, updating gasPrice: ${job.gasPrice} -> ${gasPrice}`)
        }
        logger.info(`Sending transaction with nonce ${nonce}`)
        const txHash = await sendTx({
          data: job.data,
          nonce,
          gasPrice,
          amount: '0',
          gasLimit,
          privateKey: ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY,
          to: job.to,
          chainId,
          web3: web3Redundant
        })
        const resendJob = {
          ...job,
          txHash,
          gasPrice
        }
        resendJobs.push(resendJob)

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
        if (!e.message.toLowerCase().includes('transaction with the same hash was already imported')) {
          if (isResend) {
            resendJobs.push(job)
          } else {
            failedTx.push(job)
          }
        }

        if (e.message.toLowerCase().includes('insufficient funds')) {
          insufficientFunds = true
          const currentBalance = await web3Instance.eth.getBalance(ORACLE_VALIDATOR_ADDRESS)
          minimumBalance = gasLimit.multipliedBy(gasPrice)
          logger.error(
            `Insufficient funds: ${currentBalance}. Stop processing messages until the balance is at least ${minimumBalance}.`
          )
        } else if (nonceError(e)) {
          nonce = await readNonce(true)
        }
      }
    })

    if (typeof nonce === 'number') {
      logger.debug('Updating nonce')
      await updateNonce(nonce)
    }

    if (failedTx.length) {
      logger.info(`Sending ${failedTx.length} Failed Tx to Queue`)
      await scheduleForRetry(failedTx, msg.properties.headers['x-retries'])
    }
    if (resendJobs.length) {
      logger.info(`Sending ${resendJobs.length} Tx Delayed Resend Requests to Queue`)
      await scheduleTransactionResend(resendJobs)
    }
    ackMsg(msg)
    logger.debug(`Finished processing msg`)

    if (insufficientFunds) {
      logger.warn('Insufficient funds. Stop sending transactions until the account has the minimum balance')
      channel.close()
      waitForFunds(web3Instance, ORACLE_VALIDATOR_ADDRESS, minimumBalance, resume, logger)
    }
  } catch (e) {
    logger.error(e)
    nackMsg(msg)
  }

  logger.debug('Finished')
}

initialize()
