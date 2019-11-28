const baseConfig = require('./base.config')
const { ERC20_ABI } = require('../../commons')
const { EXIT_CODES } = require('../src/utils/constants')

const initialChecksJson = process.argv[3]

if (!initialChecksJson) {
  throw new Error('initial check parameter was not provided.')
}

let initialChecks
try {
  initialChecks = JSON.parse(initialChecksJson)
} catch (e) {
  throw new Error('Error on decoding values from initial checks.')
}

const id = `${baseConfig.id}-half-duplex-transfer`

const transferWatcherRequired = baseConfig.id === 'erc-native'

if (!transferWatcherRequired) {
  console.error(`Transfer watcher not required for bridge mode ${process.env.ORACLE_BRIDGE_MODE}`)
  process.exit(EXIT_CODES.WATCHER_NOT_REQUIRED)
}

module.exports = {
  ...baseConfig.bridgeConfig,
  ...baseConfig.foreignConfig,
  event: 'Transfer',
  eventContractAddress: initialChecks.halfDuplexTokenAddress,
  eventAbi: ERC20_ABI,
  eventFilter: { to: process.env.COMMON_FOREIGN_BRIDGE_ADDRESS },
  queue: 'home',
  workerQueue: 'swap-tokens',
  name: `watcher-${id}`,
  id
}
