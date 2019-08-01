const { toWei, toBN } = require('web3-utils')
const { BRIDGE_MODES, FEE_MANAGER_MODE, ERC_TYPES } = require('./constants')

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

const normalizeGasPrice = (oracleGasPrice, factor, limits = null) => {
  let gasPrice = oracleGasPrice * factor

  if (limits !== null && gasPrice < limits.MIN) {
    gasPrice = limits.MIN
  } else if (limits !== null && gasPrice > limits.MAX) {
    gasPrice = limits.MAX
  }

  return toBN(toWei(gasPrice.toFixed(2).toString(), 'gwei'))
}

// fetchFn has to be supplied (instead of just url to oracle),
// because this utility function is shared between Browser and Node,
// we use built-in 'fetch' on browser side, and `node-fetch` package in Node.
const gasPriceFromOracle = async (fetchFn, options = {}) => {
  try {
    const response = await fetchFn()
    const json = await response.json()
    const oracleGasPrice = json[options.speedType]

    if (!oracleGasPrice) {
      options.logger &&
        options.logger.error &&
        options.logger.error(`Response from Oracle didn't include gas price for ${options.speedType} type.`)
      return null
    }

    return normalizeGasPrice(oracleGasPrice, options.factor, options.limits)
  } catch (e) {
    options.logger && options.logger.error && options.logger.error(`Gas Price API is not available. ${e.message}`)
  }
  return null
}

const gasPriceFromContract = async (bridgeContract, options = {}) => {
  try {
    const gasPrice = await bridgeContract.methods.gasPrice().call()
    options.logger &&
      options.logger.debug &&
      options.logger.debug({ gasPrice }, 'Gas price updated using the contracts')
    return gasPrice
  } catch (e) {
    options.logger &&
      options.logger.error &&
      options.logger.error(`There was a problem getting the gas price from the contract. ${e.message}`)
  }
  return null
}

module.exports = {
  decodeBridgeMode,
  decodeFeeManagerMode,
  getBridgeMode,
  getTokenType,
  getUnit,
  normalizeGasPrice,
  gasPriceFromOracle,
  gasPriceFromContract
}
