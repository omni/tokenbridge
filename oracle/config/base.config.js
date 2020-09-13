require('../env')

const { toBN } = require('web3').utils
const {
  BRIDGE_MODES,
  HOME_NATIVE_TO_ERC_ABI,
  FOREIGN_NATIVE_TO_ERC_ABI,
  HOME_ERC_TO_ERC_ABI,
  FOREIGN_ERC_TO_ERC_ABI,
  HOME_ERC_TO_NATIVE_ABI,
  FOREIGN_ERC_TO_NATIVE_ABI,
  HOME_AMB_ABI,
  FOREIGN_AMB_ABI
} = require('../../commons')
const { web3Home, web3Foreign } = require('../src/services/web3')
const { privateKeyToAddress } = require('../src/utils/utils')

const { ORACLE_VALIDATOR_ADDRESS, ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY } = process.env

let homeAbi
let foreignAbi
let id

switch (process.env.ORACLE_BRIDGE_MODE) {
  case BRIDGE_MODES.NATIVE_TO_ERC:
    homeAbi = HOME_NATIVE_TO_ERC_ABI
    foreignAbi = FOREIGN_NATIVE_TO_ERC_ABI
    id = 'native-erc'
    break
  case BRIDGE_MODES.ERC_TO_ERC:
    homeAbi = HOME_ERC_TO_ERC_ABI
    foreignAbi = FOREIGN_ERC_TO_ERC_ABI
    id = 'erc-erc'
    break
  case BRIDGE_MODES.ERC_TO_NATIVE:
    homeAbi = HOME_ERC_TO_NATIVE_ABI
    foreignAbi = FOREIGN_ERC_TO_NATIVE_ABI
    id = 'erc-native'
    break
  case BRIDGE_MODES.ARBITRARY_MESSAGE:
    homeAbi = HOME_AMB_ABI
    foreignAbi = FOREIGN_AMB_ABI
    id = 'amb'
    break
  default:
    if (process.env.NODE_ENV !== 'test') {
      throw new Error(`Bridge Mode: ${process.env.ORACLE_BRIDGE_MODE} not supported.`)
    } else {
      homeAbi = HOME_ERC_TO_NATIVE_ABI
      foreignAbi = FOREIGN_ERC_TO_NATIVE_ABI
      id = 'erc-native'
    }
}

let maxProcessingTime = null
if (String(process.env.ORACLE_MAX_PROCESSING_TIME) === '0') {
  maxProcessingTime = 0
} else if (!process.env.ORACLE_MAX_PROCESSING_TIME) {
  maxProcessingTime =
    4 * Math.max(process.env.ORACLE_HOME_RPC_POLLING_INTERVAL, process.env.ORACLE_FOREIGN_RPC_POLLING_INTERVAL)
} else {
  maxProcessingTime = Number(process.env.ORACLE_MAX_PROCESSING_TIME)
}

const bridgeConfig = {
  homeBridgeAddress: process.env.COMMON_HOME_BRIDGE_ADDRESS,
  homeBridgeAbi: homeAbi,
  foreignBridgeAddress: process.env.COMMON_FOREIGN_BRIDGE_ADDRESS,
  foreignBridgeAbi: foreignAbi,
  eventFilter: {},
  validatorAddress: ORACLE_VALIDATOR_ADDRESS || privateKeyToAddress(ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY),
  maxProcessingTime
}

const homeConfig = {
  chain: 'home',
  eventContractAddress: process.env.COMMON_HOME_BRIDGE_ADDRESS,
  eventAbi: homeAbi,
  bridgeContractAddress: process.env.COMMON_HOME_BRIDGE_ADDRESS,
  bridgeAbi: homeAbi,
  pollingInterval: process.env.ORACLE_HOME_RPC_POLLING_INTERVAL,
  startBlock: toBN(process.env.ORACLE_HOME_START_BLOCK || 0),
  web3: web3Home
}

const foreignConfig = {
  chain: 'foreign',
  eventContractAddress: process.env.COMMON_FOREIGN_BRIDGE_ADDRESS,
  eventAbi: foreignAbi,
  bridgeContractAddress: process.env.COMMON_FOREIGN_BRIDGE_ADDRESS,
  bridgeAbi: foreignAbi,
  pollingInterval: process.env.ORACLE_FOREIGN_RPC_POLLING_INTERVAL,
  startBlock: toBN(process.env.ORACLE_FOREIGN_START_BLOCK || 0),
  web3: web3Foreign
}

module.exports = {
  bridgeConfig,
  homeConfig,
  foreignConfig,
  id
}
