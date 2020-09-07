const baseConfig = require('./base.config')
const { EXIT_CODES } = require('../src/utils/constants')

const id = `${baseConfig.id}-convert-to-chai`

const workerRequired = baseConfig.id === 'erc-native'

if (!workerRequired) {
  console.error(`Convert to chai tokens worker not required for bridge mode ${process.env.ORACLE_BRIDGE_MODE}`)
  process.exit(EXIT_CODES.WATCHER_NOT_REQUIRED)
}

module.exports = {
  ...baseConfig.bridgeConfig,
  ...baseConfig.foreignConfig,
  workerQueue: 'convert-to-chai',
  senderQueue: 'foreign-prioritized',
  name: `worker-${id}`,
  id
}
