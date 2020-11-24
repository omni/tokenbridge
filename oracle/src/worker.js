const path = require('path')
const logger = require('./services/logger')
const { checkHTTPS, watchdog } = require('./utils/utils')
const { EXIT_CODES } = require('./utils/constants')
const { connectWorkerToQueue } = require('./services/amqpClient')

const config = require(path.join('../config/', process.argv[2]))

const convertToChai = require('./workers/convertToChai')(config)

const web3Instance = config.web3

async function initialize() {
  try {
    const checkHttps = checkHTTPS(process.env.ORACLE_ALLOW_HTTP_FOR_RPC, logger)

    web3Instance.currentProvider.urls.forEach(checkHttps(config.chain))

    connectWorkerToQueue({
      queueName: config.workerQueue,
      senderQueue: config.senderQueue,
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

async function run(blockNumber) {
  if (config.id === 'erc-native-convert-to-chai') {
    return convertToChai(blockNumber)
  } else {
    return []
  }
}

async function main({ msg, ackMsg, nackMsg, sendToSenderQueue, scheduleForRetry }) {
  try {
    const { blockNumber } = JSON.parse(msg.content)
    logger.info(`Msg received with block number ${blockNumber}`)

    try {
      const job = await run(blockNumber)

      logger.info('Transactions to send:', job.length)

      if (job.length) {
        await sendToSenderQueue(job)
      }
    } catch (e) {
      logger.info(`Sending failed msg to retry`)
      await scheduleForRetry({ blockNumber }, msg.properties.headers['x-retries'])
    }

    ackMsg(msg)
  } catch (e) {
    logger.error(e)
    nackMsg(msg)
  }
  logger.debug(`Finished worker operation`)
}

initialize()
