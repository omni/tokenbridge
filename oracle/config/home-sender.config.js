const baseConfig = require('./base.config')

const { DEFAULT_TRANSACTION_RESEND_INTERVAL } = require('../src/utils/constants')

const { ORACLE_HOME_TX_RESEND_INTERVAL } = process.env

module.exports = {
  ...baseConfig,
  main: baseConfig.home,
  queue: 'home-prioritized',
  id: 'home',
  name: 'sender-home',
  resendInterval: parseInt(ORACLE_HOME_TX_RESEND_INTERVAL, 10) || DEFAULT_TRANSACTION_RESEND_INTERVAL
}
