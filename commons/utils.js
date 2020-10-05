const { toWei, toBN } = require('web3-utils')
const { GasPriceOracle } = require('gas-price-oracle')
const { BRIDGE_MODES, FEE_MANAGER_MODE, ERC_TYPES } = require('./constants')
const { REWARDABLE_VALIDATORS_ABI } = require('./abis')

const gasPriceOracle = new GasPriceOracle()

function decodeBridgeMode(bridgeModeHash) {
  switch (bridgeModeHash) {
    case '0x92a8d7fe':
      return BRIDGE_MODES.NATIVE_TO_ERC
    case '0xba4690f5':
      return BRIDGE_MODES.ERC_TO_ERC
    case '0x18762d46':
      return BRIDGE_MODES.ERC_TO_NATIVE
    case '0x2544fbb9':
      return BRIDGE_MODES.ARBITRARY_MESSAGE
    case '0x16ea01e9':
      return BRIDGE_MODES.STAKE_AMB_ERC_TO_ERC
    case '0x76595b56':
      return BRIDGE_MODES.AMB_ERC_TO_ERC
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
    try {
      const isBridge = await bridgeTokenContract.methods.isBridge(bridgeAddress).call()
      if (isBridge) {
        return ERC_TYPES.ERC677
      } else {
        return ERC_TYPES.ERC20
      }
    } catch (e) {
      return ERC_TYPES.ERC20
    }
  }
}

const isErcToErcMode = bridgeMode => {
  return (
    bridgeMode === BRIDGE_MODES.ERC_TO_ERC ||
    bridgeMode === BRIDGE_MODES.AMB_ERC_TO_ERC ||
    bridgeMode === BRIDGE_MODES.STAKE_AMB_ERC_TO_ERC
  )
}

const isMediatorMode = bridgeMode => {
  return bridgeMode === BRIDGE_MODES.AMB_ERC_TO_ERC || bridgeMode === BRIDGE_MODES.STAKE_AMB_ERC_TO_ERC
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
  } else if (bridgeMode === BRIDGE_MODES.STAKE_AMB_ERC_TO_ERC) {
    unitHome = 'Tokens'
    unitForeign = 'Tokens'
  } else {
    throw new Error(`Unrecognized bridge mode: ${bridgeMode}`)
  }

  return { unitHome, unitForeign }
}

const parseValidatorEvent = event => {
  if (
    event.event === undefined &&
    event.raw &&
    event.raw.topics &&
    (event.raw.topics[0] === '0xe366c1c0452ed8eec96861e9e54141ebff23c9ec89fe27b996b45f5ec3884987' ||
      event.raw.topics[0] === '0x8064a302796c89446a96d63470b5b036212da26bd2debe5bec73e0170a9a5e83')
  ) {
    const rawAddress = event.raw.topics.length > 1 ? event.raw.topics[1] : event.raw.data
    const address = '0x' + rawAddress.slice(26)
    event.event = 'ValidatorAdded'
    event.returnValues.validator = address
  } else if (
    event.event === undefined &&
    event.raw &&
    event.raw.topics &&
    event.raw.topics[0] === '0xe1434e25d6611e0db941968fdc97811c982ac1602e951637d206f5fdda9dd8f1'
  ) {
    const rawAddress = event.raw.data === '0x' ? event.raw.topics[1] : event.raw.data
    const address = '0x' + rawAddress.slice(26)
    event.event = 'ValidatorRemoved'
    event.returnValues.validator = address
  }
}

const processValidatorsEvents = events => {
  const validatorList = new Set()
  events.forEach(event => {
    parseValidatorEvent(event)

    if (event.event === 'ValidatorAdded') {
      validatorList.add(event.returnValues.validator)
    } else if (event.event === 'ValidatorRemoved') {
      validatorList.delete(event.returnValues.validator)
    }
  })

  return Array.from(validatorList)
}

const tryCall = async (method, fallbackValue) => {
  try {
    return await method.call()
  } catch (e) {
    return fallbackValue
  }
}

const getDeployedAtBlock = async contract => tryCall(contract.methods.deployedAtBlock(), 0)

const getPastEvents = async (
  contract,
  { event = 'allEvents', fromBlock = toBN(0), toBlock = 'latest', options = {} }
) => {
  let events
  try {
    events = await contract.getPastEvents(event, {
      ...options,
      fromBlock,
      toBlock
    })
  } catch (e) {
    if (e.message.includes('query returned more than') && toBlock !== 'latest') {
      const middle = toBN(fromBlock)
        .add(toBlock)
        .divRound(toBN(2))
      const middlePlusOne = middle.add(toBN(1))

      const firstHalfEvents = await getPastEvents(contract, {
        options,
        event,
        fromBlock,
        toBlock: middle
      })
      const secondHalfEvents = await getPastEvents(contract, {
        options,
        event,
        fromBlock: middlePlusOne,
        toBlock
      })
      events = [...firstHalfEvents, ...secondHalfEvents]
    } else {
      throw new Error(e)
    }
  }
  return events
}

const getValidatorList = async (address, eth, options) => {
  options.logger && options.logger.debug && options.logger.debug('getting validatorList')

  const validatorsContract = new eth.Contract(REWARDABLE_VALIDATORS_ABI, address) // in monitor, BRIDGE_VALIDATORS_ABI was used
  const validators = await tryCall(validatorsContract.methods.validatorList(), [])

  if (validators.length) {
    return validators
  }

  options.logger && options.logger.debug && options.logger.debug('getting validatorsEvents')

  const deployedAtBlock = await tryCall(validatorsContract.methods.deployedAtBlock(), 0)
  const fromBlock = options.fromBlock || Number(deployedAtBlock) || 0
  const toBlock = options.toBlock || 'latest'

  const validatorsEvents = await getPastEvents(new eth.Contract([], address), {
    event: 'allEvents',
    fromBlock,
    toBlock,
    options: {}
  })

  return processValidatorsEvents(validatorsEvents)
}

const gasPriceWithinLimits = (gasPrice, limits) => {
  if (!limits) {
    return gasPrice
  }
  if (gasPrice < limits.MIN) {
    return limits.MIN
  } else if (gasPrice > limits.MAX) {
    return limits.MAX
  } else {
    return gasPrice
  }
}

const normalizeGasPrice = (oracleGasPrice, factor, limits = null) => {
  let gasPrice = oracleGasPrice * factor
  gasPrice = gasPriceWithinLimits(gasPrice, limits)
  return toBN(toWei(gasPrice.toFixed(2).toString(), 'gwei'))
}

// fetchFn has to be supplied (instead of just url to oracle),
// because this utility function is shared between Browser and Node,
// we use built-in 'fetch' on browser side, and `node-fetch` package in Node.
const gasPriceFromSupplier = async (fetchFn, options = {}) => {
  try {
    let json
    if (fetchFn) {
      const response = await fetchFn()
      json = await response.json()
    } else {
      json = await gasPriceOracle.fetchGasPricesOffChain()
    }
    const oracleGasPrice = json[options.speedType]

    if (!oracleGasPrice) {
      options.logger &&
        options.logger.error &&
        options.logger.error(`Response from Oracle didn't include gas price for ${options.speedType} type.`)
      return null
    }

    const normalizedGasPrice = normalizeGasPrice(oracleGasPrice, options.factor, options.limits)

    options.logger &&
      options.logger.debug &&
      options.logger.debug({ oracleGasPrice, normalizedGasPrice }, 'Gas price updated using the API')

    return normalizedGasPrice
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
  parseValidatorEvent,
  processValidatorsEvents,
  getValidatorList,
  getPastEvents,
  getDeployedAtBlock,
  normalizeGasPrice,
  gasPriceFromSupplier,
  gasPriceFromContract,
  gasPriceWithinLimits,
  isErcToErcMode,
  isMediatorMode
}
