const { BRIDGE_MODES, FEE_MANAGER_MODE, ERC_TYPES } = require('./constants')
const { ERC677_BRIDGE_TOKEN_ABI } = require('./abis')

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

const decodeFeeManagerMode = managerModeHash => {
  switch (managerModeHash) {
    case '0xf2aed8f7':
      return FEE_MANAGER_MODE.ONE_DIRECTION
    case '0xd7de965f':
      return FEE_MANAGER_MODE.BOTH_DIRECTIONS
    default:
      throw new Error(`Unrecognized fee manager mode hash: '${managerModeHash}'`)
  }
}

async function getBridgeMode(contract) {
  try {
    const bridgeModeHash = await contract.methods.getBridgeMode().call()
    return decodeBridgeMode(bridgeModeHash)
  } catch (e) {
    return BRIDGE_MODES.NATIVE_TO_ERC_V1
  }
}

const getTokenType = async (bridgeTokenContract, bridgeAddress) => {
  try {
    const resultBridgeAddress = await bridgeTokenContract.methods.bridgeContract().call()
    if (resultBridgeAddress === bridgeAddress) {
      return ERC_TYPES.ERC677
    } else {
      return ERC_TYPES.ERC20
    }
  } catch (e) {
    return ERC_TYPES.ERC20
  }
}

const getUnit = bridgeMode => {
  let unitHome = null
  let unitForeign = null
  if (bridgeMode === BRIDGE_MODES.NATIVE_TO_ERC) {
    unitHome = 'Native coins'
    unitForeign = 'Tokens'
  } else if (bridgeMode === BRIDGE_MODES.ERC_TO_ERC) {
    unitHome = 'Tokens'
    unitForeign = 'Tokens'
  } else if (bridgeMode === BRIDGE_MODES.ERC_TO_NATIVE) {
    unitHome = 'Native coins'
    unitForeign = 'Tokens'
  } else {
    throw new Error(`Unrecognized bridge mode: ${bridgeMode}`)
  }

  return { unitHome, unitForeign }
}

module.exports = {
  decodeBridgeMode,
  decodeFeeManagerMode,
  getBridgeMode,
  getTokenType,
  getUnit
}
