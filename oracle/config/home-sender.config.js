const baseConfig = require('./base.config')

const { web3Home, web3HomeRedundant, web3HomeFallback } = require('../src/services/web3')

module.exports = {
  ...baseConfig.bridgeConfig,
  queue: 'home-prioritized',
  oldQueue: 'home',
  id: 'home',
  name: 'sender-home',
  web3: web3Home,
  web3Redundant: web3HomeRedundant,
  web3Fallback: web3HomeFallback
}
