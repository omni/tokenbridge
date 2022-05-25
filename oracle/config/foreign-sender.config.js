const baseConfig = require('./base.config')

const { DEFAULT_TRANSACTION_RESEND_INTERVAL } = require('../src/utils/constants')

const { ORACLE_FOREIGN_TX_RESEND_INTERVAL } = process.env

module.exports = {
  ...baseConfig,
  main: baseConfig.foreign,
  queue: 'foreign-prioritized',
  id: 'foreign',
  name: 'sender-foreign',
  resendInterval: parseInt(ORACLE_FOREIGN_TX_RESEND_INTERVAL, 10) || DEFAULT_TRANSACTION_RESEND_INTERVAL
}
