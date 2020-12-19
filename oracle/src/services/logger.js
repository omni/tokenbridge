const pino = require('pino')
const path = require('path')
const {
  web3Home,
  web3Foreign,
  web3HomeFallback,
  web3ForeignFallback,
  web3HomeRedundant,
  web3ForeignRedundant
} = require('./web3')

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

web3Home.currentProvider.setLogger(logger)
web3Foreign.currentProvider.setLogger(logger)
web3HomeFallback.currentProvider.setLogger(logger)
web3ForeignFallback.currentProvider.setLogger(logger)
web3HomeRedundant.currentProvider.setLogger(logger)
web3ForeignRedundant.currentProvider.setLogger(logger)

module.exports = logger
