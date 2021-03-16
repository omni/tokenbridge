const baseConfig = require('./base.config')

module.exports = {
  ...baseConfig.bridgeConfig,
  id: 'shutdown-manager',
  name: 'shutdown-manager',
  pollingInterval: 120000,
  checksBeforeResume: 3,
  checksBeforeStop: 1,
  shutdownMethod: 'isShutdown()'
}
