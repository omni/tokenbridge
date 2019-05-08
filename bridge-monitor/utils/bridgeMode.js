const HOME_NATIVE_TO_ERC_ABI = require('../abis/HomeBridgeNativeToErc.abi')
const FOREIGN_NATIVE_TO_ERC_ABI = require('../abis/ForeignBridgeNativeToErc.abi')
const HOME_ERC_TO_ERC_ABI = require('../abis/HomeBridgeErcToErc.abi')
const FOREIGN_ERC_TO_ERC_ABI = require('../abis/ForeignBridgeErc677ToErc677.abi')
const HOME_ERC_TO_NATIVE_ABI = require('../abis/HomeBridgeErcToNative.abi')
const FOREIGN_ERC_TO_NATIVE_ABI = require('../abis/ForeignBridgeErcToNative.abi')

const BRIDGE_MODES = {
  NATIVE_TO_ERC: 'NATIVE_TO_ERC',
  ERC_TO_ERC: 'ERC_TO_ERC',
  ERC_TO_NATIVE: 'ERC_TO_NATIVE'
}

const ERC_TYPES = {
  ERC20: 'ERC20',
  ERC677: 'ERC677'
}

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
  } else {
    throw new Error(`Unrecognized bridge mode: ${bridgeMode}`)
  }

  return { HOME_ABI, FOREIGN_ABI }
}

function decodeBridgeMode(bridgeModeHash) {
  switch (bridgeModeHash) {
    case '0x92a8d7fe':
      return BRIDGE_MODES.NATIVE_TO_ERC
    case '0xba4690f5':
      return BRIDGE_MODES.ERC_TO_ERC
    case '0x18762d46':
      return BRIDGE_MODES.ERC_TO_NATIVE
    default:
      throw new Error(`Unrecognized bridge mode hash: '${bridgeModeHash}'`)
  }
}

module.exports = {
  decodeBridgeMode,
  getBridgeABIs,
  BRIDGE_MODES,
  ERC_TYPES
}
