const pino = require('pino')
const path = require('path')

const { setLogger } = require('./injectedLogger')

const config = process.env.NODE_ENV !== 'test' ? require(path.join('../../config/', process.argv[2])) : {}

const logger = pino({
  enabled: process.env.NODE_ENV !== 'test',
  name: config.name,
  level: process.env.ORACLE_LOG_LEVEL || 'debug',
  base: {
    validator: config.validatorAddress
  }
})

setLogger(logger)

module.exports = logger
