const baseConfig = require('./base.config')

const {
  ORACLE_SHUTDOWN_SERVICE_POLLING_INTERVAL,
  ORACLE_SHUTDOWN_SERVICE_URL,
  ORACLE_SHUTDOWN_CONTRACT_ADDRESS,
  ORACLE_SHUTDOWN_CONTRACT_METHOD
} = process.env

module.exports = {
  ...baseConfig,
  id: 'shutdown-manager',
  name: 'shutdown-manager',
  pollingInterval: ORACLE_SHUTDOWN_SERVICE_POLLING_INTERVAL || 120000,
  checksBeforeResume: 3,
  checksBeforeStop: 1,
  shutdownServiceURL: ORACLE_SHUTDOWN_SERVICE_URL,
  shutdownContractAddress: ORACLE_SHUTDOWN_CONTRACT_ADDRESS,
  shutdownMethod: (ORACLE_SHUTDOWN_CONTRACT_METHOD || 'isShutdown()').trim(),
  requestTimeout: 2000
}
