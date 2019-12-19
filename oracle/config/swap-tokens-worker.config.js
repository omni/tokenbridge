const baseConfig = require('./base.config')
const { EXIT_CODES } = require('../src/utils/constants')

const id = `${baseConfig.id}-swap-tokens`

const workerRequired = baseConfig.id === 'erc-native'

if (!workerRequired) {
  console.error(`Swap tokens worker not required for bridge mode ${process.env.ORACLE_BRIDGE_MODE}`)
  process.exit(EXIT_CODES.WATCHER_NOT_REQUIRED)
}

module.exports = {
  ...baseConfig.bridgeConfig,
  ...baseConfig.foreignConfig,
  workerQueue: 'swap-tokens',
  senderQueue: 'foreign',
  name: `worker-${id}`,
  id
}
