const baseConfig = require('./base.config')

const id = `${baseConfig.id}-swap-tokens`

module.exports = {
  ...baseConfig.bridgeConfig,
  ...baseConfig.foreignConfig,
  workerQueue: 'swap-tokens',
  senderQueue: 'foreign',
  name: `worker-${id}`,
  id
}
