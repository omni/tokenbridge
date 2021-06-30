const pino = require('pino')
const path = require('path')

const { setLogger } = require('./injectedLogger')

const config = process.env.NODE_ENV !== 'test' ? require(path.join('../../config/', process.argv[2])) : {}

const logger = pino({
  enabled: process.env.NODE_ENV !== 'test',
  name: config.name,
  level: process.env.ORACLE_LOG_LEVEL || 'debug',
  base:
    process.env.NODE_ENV === 'production'
      ? {
          validator: process.env.ORACLE_VALIDATOR_ADDRESS
        }
      : {}
})

setLogger(logger)

module.exports = logger
