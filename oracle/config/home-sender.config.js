const baseConfig = require('./base.config')

const { DEFAULT_TRANSACTION_RESEND_INTERVAL } = require('../src/utils/constants')
const { web3Home, web3HomeRedundant, web3HomeFallback } = require('../src/services/web3')

const { ORACLE_HOME_TX_RESEND_INTERVAL } = process.env

module.exports = {
  ...baseConfig,
  queue: 'home-prioritized',
  oldQueue: 'home',
  id: 'home',
  name: 'sender-home',
  web3: web3Home,
  web3Redundant: web3HomeRedundant,
  web3Fallback: web3HomeFallback,
  resendInterval: parseInt(ORACLE_HOME_TX_RESEND_INTERVAL, 10) || DEFAULT_TRANSACTION_RESEND_INTERVAL
}
