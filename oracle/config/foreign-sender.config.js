const baseConfig = require('./base.config')

const { DEFAULT_TRANSACTION_RESEND_INTERVAL } = require('../src/utils/constants')
const { web3Foreign, web3ForeignRedundant, web3ForeignFallback } = require('../src/services/web3')

const { ORACLE_FOREIGN_TX_RESEND_INTERVAL } = process.env

module.exports = {
  ...baseConfig,
  queue: 'foreign-prioritized',
  oldQueue: 'foreign',
  id: 'foreign',
  name: 'sender-foreign',
  web3: web3Foreign,
  web3Redundant: web3ForeignRedundant,
  web3Fallback: web3ForeignFallback,
  resendInterval: parseInt(ORACLE_FOREIGN_TX_RESEND_INTERVAL, 10) || DEFAULT_TRANSACTION_RESEND_INTERVAL
}
