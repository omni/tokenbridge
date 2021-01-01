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

const id = `${baseConfig.id}-transfer`

if (baseConfig.id !== 'erc-native') {
  console.error(`Transfer watcher not required for bridge mode ${process.env.ORACLE_BRIDGE_MODE}`)
  process.exit(EXIT_CODES.WATCHER_NOT_REQUIRED)
}

module.exports = {
  ...baseConfig,
  main: {
    ...baseConfig.foreign,
    eventContract: new baseConfig.foreign.web3.eth.Contract(ERC20_ABI, initialChecks.bridgeableTokenAddress)
  },
  event: 'Transfer',
  eventFilter: { to: process.env.COMMON_FOREIGN_BRIDGE_ADDRESS },
  queue: 'home-prioritized',
  name: `watcher-${id}`,
  id
}
