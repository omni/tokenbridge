const Redis = require('ioredis')
const logger = require('./logger')

const redis = new Redis(process.env.REDIS_URL)

redis.on('connect', () => {
  logger.info('Connected to redis')
})

redis.on('error', () => {
  logger.error('Disconnected from redis')
})

module.exports = {
  redis
}
