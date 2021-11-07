const baseConfig = require('./base.config')
const { ERC20_ABI, ZERO_ADDRESS } = require('../../commons')
const { EXIT_CODES } = require('../src/utils/constants')

const id = `${baseConfig.id}-transfer`

if (baseConfig.id !== 'erc-native') {
  console.error(`Transfer watcher not required for bridge mode ${process.env.ORACLE_BRIDGE_MODE}`)
  process.exit(EXIT_CODES.WATCHER_NOT_REQUIRED)
}

// exact address of the token contract is set in the watcher.js checkConditions() function
baseConfig.foreign.eventContract = new baseConfig.foreign.web3.eth.Contract(ERC20_ABI, ZERO_ADDRESS)

module.exports = {
  ...baseConfig,
  main: baseConfig.foreign,
  event: 'Transfer',
  eventFilter: { to: baseConfig.foreign.bridgeAddress },
  sender: 'home',
  queue: 'home-prioritized',
  name: `watcher-${id}`,
  id
}
