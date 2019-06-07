const baseConfig = require('./base.config')
const erc20Abi = require('../../contracts/build/contracts/ERC20').abi
const { ERC_TYPES } = require('../src/utils/constants')

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

const id = `${baseConfig.id}-affirmation-request`

module.exports =
  (baseConfig.id === 'erc-erc' && initialChecks.foreignERC === ERC_TYPES.ERC20) ||
  baseConfig.id === 'erc-native'
    ? {
        ...baseConfig.bridgeConfig,
        ...baseConfig.foreignConfig,
        event: 'Transfer',
        eventContractAddress: process.env.ERC20_TOKEN_ADDRESS,
        eventAbi: erc20Abi,
        eventFilter: { to: process.env.FOREIGN_BRIDGE_ADDRESS },
        queue: 'home',
        name: `watcher-${id}`,
        id
      }
    : {
        ...baseConfig.bridgeConfig,
        ...baseConfig.foreignConfig,
        event: 'UserRequestForAffirmation',
        queue: 'home',
        name: `watcher-${id}`,
        id
      }
