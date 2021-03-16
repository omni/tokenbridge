const fetch = require('node-fetch')
const path = require('path')

const { EXIT_CODES } = require('./utils/constants')
const { watchdog } = require('./utils/utils')
const logger = require('./services/logger')
const { redis } = require('./services/redisClient')
const { web3Side } = require('./services/web3')

const { ORACLE_SHUTDOWN_SERVICE_URL, ORACLE_SHUTDOWN_CONTRACT_ADDRESS, ORACLE_SHUTDOWN_CONTRACT_METHOD } = process.env

if (process.argv.length < 3) {
  logger.error('Please check the number of arguments, config file was not provided')
  process.exit(EXIT_CODES.GENERAL_ERROR)
}

if (ORACLE_SHUTDOWN_CONTRACT_ADDRESS && !web3Side) {
  logger.error(
    'ORACLE_SHUTDOWN_CONTRACT_ADDRESS was provided but not side chain provider was registered.' +
      ' Please, specify ORACLE_SIDE_RPC_URL as well.'
  )
  process.exit(EXIT_CODES.GENERAL_ERROR)
}

const config = require(path.join('../config/', process.argv[2]))

let isShutdown
let shutdownCount = 0
let okCount = 0

async function getShutdownFlag() {
  logger.debug('Reading current shutdown state from the DB')
  isShutdown = (await redis.get(config.shutdownKey)) === 'true'
  logger.info({ isShutdown }, 'Read shutdown state from the DB')
}

async function setShutdownFlag(value) {
  logger.info({ isShutdown: value }, 'Updating current shutdown state in the DB')
  isShutdown = value
  await redis.set(config.shutdownKey, value)
  logger.debug('Updated state in the DB')
}

async function fetchShutdownFlag() {
  if (ORACLE_SHUTDOWN_SERVICE_URL) {
    logger.debug({ url: ORACLE_SHUTDOWN_SERVICE_URL }, 'Fetching shutdown status from external URL')
    const result = await fetch(ORACLE_SHUTDOWN_SERVICE_URL, {
      headers: {
        'Content-type': 'application/json'
      },
      method: 'GET',
      timeout: config.requestTimeout
    }).then(res => res.json())

    if (result.shutdown === true) {
      return true
    }
  }

  if (ORACLE_SHUTDOWN_CONTRACT_ADDRESS) {
    const shutdownMethod = ORACLE_SHUTDOWN_CONTRACT_METHOD.trim() || config.shutdownMethod
    const shutdownSelector = web3Side.eth.abi.encodeEventSignature(shutdownMethod)
    logger.debug(
      { contract: ORACLE_SHUTDOWN_CONTRACT_ADDRESS, method: shutdownMethod, data: shutdownSelector },
      'Fetching shutdown status from contract'
    )
    const result = await web3Side.eth.call({
      to: ORACLE_SHUTDOWN_CONTRACT_ADDRESS,
      data: shutdownSelector
    })
    logger.debug({ result }, 'Obtained result from the side RPC endpoint')

    if (result.length > 2 && web3Side.eth.abi.decodeParameter('bool', result)) {
      return true
    }
  }

  return false
}

async function checkShutdownFlag() {
  const isShutdownFlag = await fetchShutdownFlag()

  if (isShutdownFlag === true && isShutdown === false) {
    shutdownCount += 1
    okCount = 0
    logger.info(
      { shutdownCount, remainingChecks: config.checksBeforeStop - shutdownCount },
      'Received positive shutdown flag'
    )
  } else if (isShutdownFlag === false && isShutdown === true) {
    okCount += 1
    shutdownCount = 0
    logger.info({ okCount, remainingChecks: config.checksBeforeResume - okCount }, 'Received negative shutdown flag')
  } else {
    shutdownCount = 0
    okCount = 0
    logger.debug({ isShutdown, isShutdownFlag }, 'Received shutdown flag that is equal to the current state')
  }

  if (shutdownCount >= config.checksBeforeStop) {
    await setShutdownFlag(true)
  } else if (okCount >= config.checksBeforeResume) {
    await setShutdownFlag(false)
  }
}

async function initialize() {
  logger.info('Starting shutdown flag watcher')
  redis.on('connect', async () => {
    await getShutdownFlag()
    await main()
  })
}

async function main() {
  try {
    await watchdog(checkShutdownFlag, config.maxProcessingTime, () => {
      logger.fatal('Max processing time reached')
      process.exit(EXIT_CODES.MAX_TIME_REACHED)
    })
  } catch (e) {
    logger.error(e)
  }

  setTimeout(main, config.pollingInterval)
}

initialize()
