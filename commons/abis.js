const HOME_NATIVE_TO_ERC_ABI = require('../contracts/build/contracts/HomeBridgeNativeToErc').abi
const FOREIGN_NATIVE_TO_ERC_ABI = require('../contracts/build/contracts/ForeignBridgeNativeToErc').abi
const HOME_ERC_TO_ERC_ABI = require('../contracts/build/contracts/HomeBridgeErcToErc').abi
const FOREIGN_ERC_TO_ERC_ABI = require('../contracts/build/contracts/ForeignBridgeErc677ToErc677').abi
const HOME_ERC_TO_NATIVE_ABI = require('../contracts/build/contracts/HomeBridgeErcToNative').abi
const FOREIGN_ERC_TO_NATIVE_ABI = require('../contracts/build/contracts/ForeignBridgeErcToNative').abi
const ERC20_ABI = require('../contracts/build/contracts/ERC20').abi
const ERC677_ABI = require('../contracts/build/contracts/ERC677').abi
const ERC677_BRIDGE_TOKEN_ABI = require('../contracts/build/contracts/ERC677BridgeToken').abi
const BLOCK_REWARD_ABI = require('../contracts/build/contracts/BlockReward').abi
const BRIDGE_VALIDATORS_ABI = require('../contracts/build/contracts/BridgeValidators').abi
const REWARDABLE_VALIDATORS_ABI = require('../contracts/build/contracts/RewardableValidators').abi
const HOME_AMB_ABI = require('../contracts/build/contracts/HomeAMB').abi
const FOREIGN_AMB_ABI = require('../contracts/build/contracts/ForeignAMB').abi
const BOX_ABI = require('../contracts/build/contracts/Box').abi
const HOME_AMB_ERC_TO_ERC_ABI = require('../contracts/build/contracts/HomeAMBErc677ToErc677').abi
const FOREIGN_AMB_ERC_TO_ERC_ABI = require('../contracts/build/contracts/ForeignAMBErc677ToErc677').abi
const HOME_STAKE_ERC_TO_ERC_ABI = require('../contracts/build/contracts/HomeStakeTokenMediator').abi
const FOREIGN_STAKE_ERC_TO_ERC_ABI = require('../contracts/build/contracts/ForeignStakeTokenMediator').abi

const { HOME_V1_ABI, FOREIGN_V1_ABI } = require('./v1Abis')
const { BRIDGE_MODES } = require('./constants')

const ERC20_BYTES32_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [
      {
        name: '',
        type: 'bytes32'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        name: '',
        type: 'bytes32'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
]

const OLD_AMB_USER_REQUEST_FOR_SIGNATURE_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'encodedData',
        type: 'bytes'
      }
    ],
    name: 'UserRequestForSignature',
    type: 'event'
  }
]

const OLD_AMB_USER_REQUEST_FOR_AFFIRMATION_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'encodedData',
        type: 'bytes'
      }
    ],
    name: 'UserRequestForAffirmation',
    type: 'event'
  }
]

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
    HOME_ABI = HOME_V1_ABI
    FOREIGN_ABI = FOREIGN_V1_ABI
  } else if (bridgeMode === BRIDGE_MODES.ARBITRARY_MESSAGE) {
    HOME_ABI = HOME_AMB_ABI
    FOREIGN_ABI = FOREIGN_AMB_ABI
  } else if (bridgeMode === BRIDGE_MODES.AMB_ERC_TO_ERC) {
    HOME_ABI = HOME_AMB_ERC_TO_ERC_ABI
    FOREIGN_ABI = FOREIGN_AMB_ERC_TO_ERC_ABI
  } else if (bridgeMode === BRIDGE_MODES.STAKE_AMB_ERC_TO_ERC) {
    HOME_ABI = HOME_STAKE_ERC_TO_ERC_ABI
    FOREIGN_ABI = FOREIGN_STAKE_ERC_TO_ERC_ABI
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
  REWARDABLE_VALIDATORS_ABI,
  HOME_V1_ABI,
  FOREIGN_V1_ABI,
  ERC20_BYTES32_ABI,
  HOME_AMB_ABI,
  FOREIGN_AMB_ABI,
  OLD_AMB_USER_REQUEST_FOR_AFFIRMATION_ABI,
  OLD_AMB_USER_REQUEST_FOR_SIGNATURE_ABI,
  BOX_ABI,
  HOME_STAKE_ERC_TO_ERC_ABI,
  FOREIGN_STAKE_ERC_TO_ERC_ABI
}
