const { redis } = require('./redisClient')

let isShutdown = false
async function getShutdownFlag(logger, shutdownKey, force = false) {
  if (force) {
    logger.debug('Reading current shutdown state from the DB')
    isShutdown = (await redis.get(shutdownKey)) === 'true'
    logger.debug({ isShutdown }, 'Read shutdown state from the DB')
  }
  return isShutdown
}

async function setShutdownFlag(logger, shutdownKey, value) {
  logger.info({ isShutdown: value }, 'Updating current shutdown state in the DB')
  isShutdown = value
  await redis.set(shutdownKey, value)
  logger.debug('Updated state in the DB')
}

module.exports = {
  getShutdownFlag,
  setShutdownFlag
}
