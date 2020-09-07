require('../env')
const path = require('path')
const { toBN } = require('web3-utils')
const { connectSenderToQueue } = require('./services/amqpClient')
const { redis } = require('./services/redisClient')
const GasPrice = require('./services/gasPrice')
const logger = require('./services/logger')
const rpcUrlsManager = require('./services/getRpcUrlsManager')
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

const { ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY } = process.env

const ORACLE_VALIDATOR_ADDRESS = privateKeyToAddress(ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY)

if (process.argv.length < 3) {
  logger.error('Please check the number of arguments, config file was not provided')
  process.exit(EXIT_CODES.GENERAL_ERROR)
}

const config = require(path.join('../config/', process.argv[2]))

const web3Instance = config.web3
const nonceKey = `${config.id}:nonce`
let chainId = 0

async function initialize() {
  try {
    const checkHttps = checkHTTPS(process.env.ORACLE_ALLOW_HTTP_FOR_RPC, logger)

    rpcUrlsManager.homeUrls.forEach(checkHttps('home'))
    rpcUrlsManager.foreignUrls.forEach(checkHttps('foreign'))

    GasPrice.start(config.id)

    chainId = await getChainId(config.id)
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
    logger.debug("Nonce wasn't found in the DB")
    return getNonce(web3Instance, ORACLE_VALIDATOR_ADDRESS)
  }
}

function updateNonce(nonce) {
  return redis.set(nonceKey, nonce)
}

async function main({ msg, ackMsg, nackMsg, channel, scheduleForRetry, scheduleTransactionResend }) {
  try {
    if (redis.status !== 'ready') {
      nackMsg(msg)
      return
    }

    const txArray = JSON.parse(msg.content)
    logger.info(`Msg received with ${txArray.length} Tx to send`)
    const gasPrice = GasPrice.getPrice()

    let nonce = await readNonce()
    let insufficientFunds = false
    let minimumBalance = null
    const failedTx = []
    const sentTx = []

    const isResend = txArray.length > 0 && !!txArray[0].txHash

    if (isResend) {
      logger.debug(`Checking status of ${txArray.length} transactions`)
    } else {
      logger.debug(`Sending ${txArray.length} transactions`)
    }
    await syncForEach(txArray, async job => {
      let gasLimit
      if (typeof job.extraGas === 'number') {
        gasLimit = addExtraGas(job.gasEstimate + job.extraGas, 0, MAX_GAS_LIMIT)
      } else {
        gasLimit = addExtraGas(job.gasEstimate, EXTRA_GAS_PERCENTAGE, MAX_GAS_LIMIT)
      }

      try {
        let txNonce
        if (isResend) {
          const tx = await web3Instance.eth.getTransaction(job.txHash)

          if (tx === null) {
            logger.info(`Transaction ${job.txHash} was not found, dropping it`)
            return
          }
          if (tx.blockNumber !== null) {
            logger.info(`Transaction ${job.txHash} was successfully mined`)
            return
          }

          logger.info(
            `Previously sent transaction is stuck, updating gasPrice: ${tx.gasPrice} -> ${gasPrice.toString(10)}`
          )
          if (toBN(tx.gasPrice).gte(toBN(gasPrice))) {
            logger.info("Gas price returned from the oracle didn't increase, will reinspect this transaction later")
            sentTx.push(job)
            return
          }

          txNonce = tx.nonce
        } else {
          txNonce = nonce++
        }
        logger.info(`Sending transaction with nonce ${txNonce}`)
        const txHash = await sendTx({
          chain: config.id,
          data: job.data,
          nonce: txNonce,
          gasPrice: gasPrice.toString(10),
          amount: '0',
          gasLimit,
          privateKey: ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY,
          to: job.to,
          chainId,
          web3: web3Instance
        })
        sentTx.push({
          ...job,
          txHash
        })

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
        if (!e.message.includes('Transaction with the same hash was already imported')) {
          failedTx.push(job)
        }

        if (e.message.includes('Insufficient funds')) {
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

    logger.debug('Updating nonce')
    await updateNonce(nonce)

    if (failedTx.length) {
      logger.info(`Sending ${failedTx.length} Failed Tx to Queue`)
      await scheduleForRetry(failedTx, msg.properties.headers['x-retries'])
    }
    if (sentTx.length) {
      logger.info(`Sending ${sentTx.length} Tx Delayed Resend Requests to Queue`)
      await scheduleTransactionResend(sentTx)
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
