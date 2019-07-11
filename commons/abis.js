const path = '../contracts/build/contracts/'

const HOME_NATIVE_TO_ERC_ABI = require(`${path}HomeBridgeNativeToErc`).abi
const FOREIGN_NATIVE_TO_ERC_ABI = require(`${path}ForeignBridgeNativeToErc`).abi
const HOME_ERC_TO_ERC_ABI = require(`${path}HomeBridgeErcToErc`).abi
const FOREIGN_ERC_TO_ERC_ABI = require(`${path}ForeignBridgeErc677ToErc677`).abi
const HOME_ERC_TO_NATIVE_ABI = require(`${path}HomeBridgeErcToNative`).abi
const FOREIGN_ERC_TO_NATIVE_ABI = require(`${path}ForeignBridgeErcToNaive`).abi
const ERC20_ABI = require(`${path}ERC20`).abi
const ERC677_ABI = require(`${path}ERC677`).abi
const ERC677_BRIDGE_TOKEN_ABI = require(`${path}ERC677BridgeToken`).abi
const BLOCK_REWARD_ABI = require(`${path}IBlockReward`).abi
const BRIDGE_VALIDATORS_ABI = require(`${path}BridgeValidators`).abi
const REWARDABLE_VALIDATORS_ABI = require(`${path}RewardableValidators`).abi

const { homeV1Abi, foreignViAbi } = require('./v1Abis')
const { BRIDGE_MODES } = require('./constants')

function getBridgeABIs(bridgeMode) {
  let HOME_ABI = null
  let FOREIGN_ABI = null
  if (bridgeMode === BRIDGE_MODES.NATIVE_TO_ERC) {
    HOME_ABI = HOME_NATIVE_TO_ERC_ABI
    FOREIGN_ABI = FOREIGN_NATIVE_TO_ERC_ABI
  } else if (bridgeMode === BRIDGE_MODES.ERC_TO_ERC) {
    HOME_ABI = HOME_ERC_TO_ERC_ABI
    FOREIGN_ABI = FOREIGN_ERC_TO_ERC_ABI
  } else if (bridgeMode === BRIDGE_MODES.ERC_TO_NATIVE) {
    HOME_ABI = HOME_ERC_TO_NATIVE_ABI
    FOREIGN_ABI = FOREIGN_ERC_TO_NATIVE_ABI
  } else if (bridgeMode === BRIDGE_MODES.NATIVE_TO_ERC_V1) {
    HOME_ABI = homeV1Abi
    FOREIGN_ABI = foreignViAbi
  } else {
    throw new Error(`Unrecognized bridge mode: ${bridgeMode}`)
  }

  return { HOME_ABI, FOREIGN_ABI }
}

module.exports = {
  getBridgeABIs,
  HOME_NATIVE_TO_ERC_ABI,
  FOREIGN_NATIVE_TO_ERC_ABI,
  HOME_ERC_TO_ERC_ABI,
  FOREIGN_ERC_TO_ERC_ABI,
  HOME_ERC_TO_NATIVE_ABI,
  FOREIGN_ERC_TO_NATIVE_ABI,
  ERC20_ABI,
  ERC677_ABI,
  ERC677_BRIDGE_TOKEN_ABI,
  BLOCK_REWARD_ABI,
  BRIDGE_VALIDATORS_ABI,
  REWARDABLE_VALIDATORS_ABI
}
