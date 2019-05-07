const pino = require('pino')
const path = require('path')

const config =
  process.env.NODE_ENV !== 'test' ? require(path.join('../../config/', process.argv[2])) : {}

const logger = pino({
  enabled: process.env.NODE_ENV !== 'test',
  name: config.name,
  level: process.env.LOG_LEVEL || 'debug',
  base:
    process.env.NODE_ENV === 'production'
      ? {
          validator: process.env.VALIDATOR_ADDRESS
        }
      : {}
})

module.exports = logger
