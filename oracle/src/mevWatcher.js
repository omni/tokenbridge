require('../env')
const path = require('path')
const { redis } = require('./services/redisClient')
const logger = require('./services/logger')
const { getBlockNumber, getRequiredBlockConfirmations, getEvents } = require('./tx/web3')
const { checkHTTPS, watchdog, syncForEach } = require('./utils/utils')
const { processCollectedSignaturesBuilder } = require('./events/processAMBCollectedSignaturesMEV')
const {
  EXIT_CODES,
  BLOCK_NUMBER_PROGRESS_ITERATIONS_LIMIT,
  MAX_HISTORY_BLOCK_TO_REPROCESS
} = require('./utils/constants')

if (process.argv.length < 3) {
  logger.error('Please check the number of arguments, config file was not provided')
  process.exit(EXIT_CODES.GENERAL_ERROR)
}

const config = require(path.join('../config/', process.argv[2]))

const processAMBCollectedSignaturesMEV = processCollectedSignaturesBuilder(config)

const {
  web3,
  bridgeContract,
  eventContract,
  startBlock,
  pollingInterval,
  chain,
  reprocessingOptions,
  blockPollingLimit
} = config.main
const lastBlockRedisKey = `${config.id}:lastProcessedBlock`
const lastReprocessedBlockRedisKey = `${config.id}:lastReprocessedBlock`
const seenEventsRedisKey = `${config.id}:seenEvents`
const mevJobsRedisKey = `${config.id}:mevJobs`
let lastProcessedBlock = Math.max(startBlock - 1, 0)
let lastReprocessedBlock
let lastSeenBlockNumber = 0
let sameBlockNumberCounter = 0

async function initialize() {
  try {
    const checkHttps = checkHTTPS(process.env.ORACLE_ALLOW_HTTP_FOR_RPC, logger)

    web3.currentProvider.urls.forEach(checkHttps(chain))

    await getLastProcessedBlock()
    await getLastReprocessedBlock()
    runMain({ sendToQueue: saveJobsToRedis })
  } catch (e) {
    logger.error(e)
    process.exit(EXIT_CODES.GENERAL_ERROR)
  }
}

async function runMain({ sendToQueue }) {
  try {
    if (redis.status === 'ready') {
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
  }, pollingInterval)
}

async function saveJobsToRedis(jobs) {
  return syncForEach(jobs, job => redis.hset(mevJobsRedisKey, job.transactionReference, JSON.stringify(job)))
}

async function getLastProcessedBlock() {
  const result = await redis.get(lastBlockRedisKey)
  logger.debug({ fromRedis: result, fromConfig: lastProcessedBlock }, 'Last Processed block obtained')
  lastProcessedBlock = result ? parseInt(result, 10) : lastProcessedBlock
}

async function getLastReprocessedBlock() {
  if (reprocessingOptions.enabled) {
    const result = await redis.get(lastReprocessedBlockRedisKey)
    if (result) {
      lastReprocessedBlock = Math.max(parseInt(result, 10), lastProcessedBlock - MAX_HISTORY_BLOCK_TO_REPROCESS)
    } else {
      lastReprocessedBlock = lastProcessedBlock
    }
    logger.debug({ block: lastReprocessedBlock }, 'Last reprocessed block obtained')
  } else {
    // when reprocessing is being enabled not for the first time,
    // we do not want to process blocks for which we didn't recorded seen events,
    // instead, we want to start from the current block.
    // Thus we should delete this reprocessing pointer once it is disabled.
    await redis.del(lastReprocessedBlockRedisKey)
  }
}

function updateLastProcessedBlock(lastBlockNumber) {
  lastProcessedBlock = lastBlockNumber
  return redis.set(lastBlockRedisKey, lastProcessedBlock)
}

function updateLastReprocessedBlock(lastBlockNumber) {
  lastReprocessedBlock = lastBlockNumber
  return redis.set(lastReprocessedBlockRedisKey, lastReprocessedBlock)
}

function processEvents(events) {
  switch (config.id) {
    case 'amb-collected-signatures-mev':
      return processAMBCollectedSignaturesMEV(events)
    default:
      return []
  }
}

const eventKey = e => `${e.transactionHash}-${e.logIndex}`

async function reprocessOldLogs(sendToQueue) {
  const fromBlock = lastReprocessedBlock + 1
  const toBlock = lastReprocessedBlock + reprocessingOptions.batchSize
  const events = await getEvents({
    contract: eventContract,
    event: config.event,
    fromBlock,
    toBlock,
    filter: config.eventFilter
  })
  const alreadySeenEvents = await getSeenEvents(fromBlock, toBlock)
  const missingEvents = events.filter(e => !alreadySeenEvents[eventKey(e)])
  if (missingEvents.length === 0) {
    logger.debug('No missed events were found')
  } else {
    logger.info(`Found ${missingEvents.length} ${config.event} missed events`)
    const job = await processEvents(missingEvents)
    logger.info('Missed events transactions to send:', job.length)
    if (job.length) {
      await sendToQueue(job)
    }
  }

  await updateLastReprocessedBlock(toBlock)
  await deleteSeenEvents(0, toBlock)
}

async function getSeenEvents(fromBlock, toBlock) {
  const keys = await redis.zrangebyscore(seenEventsRedisKey, fromBlock, toBlock)
  const res = {}
  keys.forEach(k => {
    res[k] = true
  })
  return res
}

function deleteSeenEvents(fromBlock, toBlock) {
  return redis.zremrangebyscore(seenEventsRedisKey, fromBlock, toBlock)
}

function addSeenEvents(events) {
  return redis.zadd(seenEventsRedisKey, ...events.flatMap(e => [e.blockNumber, eventKey(e)]))
}

async function getLastBlockToProcess(web3, bridgeContract) {
  const [lastBlockNumber, requiredBlockConfirmations] = await Promise.all([
    getBlockNumber(web3),
    getRequiredBlockConfirmations(bridgeContract)
  ])

  if (lastBlockNumber < lastSeenBlockNumber) {
    sameBlockNumberCounter = 0
    logger.warn({ lastBlockNumber, lastSeenBlockNumber }, 'Received block number less than already seen block')
    web3.currentProvider.switchToFallbackRPC()
  } else if (lastBlockNumber === lastSeenBlockNumber) {
    sameBlockNumberCounter++
    if (sameBlockNumberCounter > 1) {
      logger.info({ lastBlockNumber, sameBlockNumberCounter }, 'Received the same block number more than twice')
      if (sameBlockNumberCounter >= BLOCK_NUMBER_PROGRESS_ITERATIONS_LIMIT) {
        sameBlockNumberCounter = 0
        logger.warn(
          { lastBlockNumber, n: BLOCK_NUMBER_PROGRESS_ITERATIONS_LIMIT },
          'Received the same block number for too many times. Probably node is not synced anymore'
        )
        web3.currentProvider.switchToFallbackRPC()
      }
    }
  } else {
    sameBlockNumberCounter = 0
    lastSeenBlockNumber = lastBlockNumber
  }
  return lastBlockNumber - requiredBlockConfirmations
}

async function main({ sendToQueue }) {
  try {
    const lastBlockToProcess = await getLastBlockToProcess(web3, bridgeContract)

    if (reprocessingOptions.enabled) {
      if (lastReprocessedBlock + reprocessingOptions.batchSize + reprocessingOptions.blockDelay < lastBlockToProcess) {
        await reprocessOldLogs(sendToQueue)
        return
      }
    }

    if (lastBlockToProcess <= lastProcessedBlock) {
      logger.debug('All blocks already processed')
      return
    }

    const fromBlock = lastProcessedBlock + 1
    const rangeEndBlock = blockPollingLimit ? fromBlock + blockPollingLimit : lastBlockToProcess
    const toBlock = Math.min(lastBlockToProcess, rangeEndBlock)

    const events = await getEvents({
      contract: eventContract,
      event: config.event,
      fromBlock,
      toBlock,
      filter: config.eventFilter
    })
    logger.info(`Found ${events.length} ${config.event} events`)

    if (events.length) {
      const job = await processEvents(events)
      logger.info('Transactions to send:', job.length)

      if (job.length) {
        await sendToQueue(job)
      }
      if (reprocessingOptions.enabled) {
        await addSeenEvents(events)
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
