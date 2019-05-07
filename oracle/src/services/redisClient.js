const Redis = require('ioredis')
const Redlock = require('redlock')
const logger = require('./logger')

const redis = new Redis(process.env.REDIS_URL)
const redlock = new Redlock([redis], {
  driftFactor: 0.01,
  retryCount: 200,
  retryDelay: 500,
  retryJitter: 500
})

redis.on('connect', () => {
  logger.info('Connected to redis')
})

redis.on('error', () => {
  logger.error('Disconnected from redis')
})

module.exports = {
  redis,
  redlock
}
