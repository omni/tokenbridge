const baseConfig = require('./base.config')

const { web3Foreign } = require('../src/services/web3')

module.exports = {
  ...baseConfig.bridgeConfig,
  queue: 'foreign-prioritized',
  oldQueue: 'foreign',
  id: 'foreign',
  name: 'sender-foreign',
  web3: web3Foreign
}
