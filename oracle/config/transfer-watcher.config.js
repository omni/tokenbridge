const baseConfig = require('./base.config')
const { ERC20_ABI, ERC_TYPES } = require('../../commons')
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

if (baseConfig.id === 'erc-erc' && initialChecks.foreignERC === ERC_TYPES.ERC677) {
  baseConfig.id = 'erc677-erc677'
}

const id = `${baseConfig.id}-transfer`

const transferWatcherRequired =
  (baseConfig.id === 'erc-erc' && initialChecks.foreignERC === ERC_TYPES.ERC20) || baseConfig.id === 'erc-native'

if (!transferWatcherRequired) {
  console.error(`Transfer watcher not required for bridge mode ${process.env.ORACLE_BRIDGE_MODE}`)
  process.exit(EXIT_CODES.WATCHER_NOT_REQUIRED)
}

const workerQueueConfig = {}
if (baseConfig.id === 'erc-native') {
  workerQueueConfig.workerQueue = 'convert-to-chai'
}

module.exports = {
  ...baseConfig.bridgeConfig,
  ...baseConfig.foreignConfig,
  event: 'Transfer',
  eventContractAddress: initialChecks.bridgeableTokenAddress,
  eventAbi: ERC20_ABI,
  eventFilter: { to: process.env.COMMON_FOREIGN_BRIDGE_ADDRESS },
  queue: 'home-prioritized',
  ...workerQueueConfig,
  name: `watcher-${id}`,
  id
}
