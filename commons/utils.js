const { toWei, toBN, BN } = require('web3-utils')
const { GasPriceOracle } = require('gas-price-oracle')
const fetch = require('node-fetch')
const { BRIDGE_MODES } = require('./constants')
const { REWARDABLE_VALIDATORS_ABI } = require('./abis')

const gasPriceOracle = new GasPriceOracle()

function decodeBridgeMode(bridgeModeHash) {
  switch (bridgeModeHash) {
    case '0x18762d46':
      return BRIDGE_MODES.ERC_TO_NATIVE
    case '0x2544fbb9':
      return BRIDGE_MODES.ARBITRARY_MESSAGE
    case '0x76595b56':
      return BRIDGE_MODES.AMB_ERC_TO_ERC
    default:
      throw new Error(`Unrecognized bridge mode hash: '${bridgeModeHash}'`)
  }
}

async function getBridgeMode(contract) {
  const bridgeModeHash = await contract.methods.getBridgeMode().call()
  return decodeBridgeMode(bridgeModeHash)
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

const getPastEventsOrSplit = async (contract, { event, fromBlock, toBlock, options }) => {
  let events = []
  try {
    events = await contract.getPastEvents(event, {
      ...options,
      fromBlock,
      toBlock
    })
  } catch (e) {
    if (e.message.includes('query returned more than') || e.message.toLowerCase().includes('timeout')) {
      const middle = toBN(fromBlock)
        .add(toBN(toBlock))
        .divRound(toBN(2))
      const middlePlusOne = middle.add(toBN(1))

      const firstHalfEvents = await getPastEventsOrSplit(contract, {
        options,
        event,
        fromBlock,
        toBlock: middle
      })
      const secondHalfEvents = await getPastEventsOrSplit(contract, {
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

const getPastEvents = async (
  contract,
  { event = 'allEvents', fromBlock = toBN(0), toBlock = 'latest', options = {} }
) => {
  if (toBlock === 'latest') {
    return contract.getPastEvents(event, {
      ...options,
      fromBlock,
      toBlock
    })
  }

  const batchSize = 1000000
  const to = toBN(toBlock)
  const events = []

  for (let from = toBN(fromBlock); from.lte(to); from = from.addn(batchSize + 1)) {
    const opts = { event, fromBlock: from, toBlock: BN.min(to, from.addn(batchSize)), options }
    const batch = await getPastEventsOrSplit(contract, opts)
    events.push(batch)
  }

  return [].concat(...events)
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

const gasPriceFromSupplier = async (url, options = {}) => {
  try {
    let json
    if (url === 'gas-price-oracle') {
      json = await gasPriceOracle.fetchGasPricesOffChain()
    } else if (url) {
      const response = await fetch(url, { timeout: 2000 })
      json = await response.json()
    } else {
      return null
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
  getBridgeMode,
  parseValidatorEvent,
  processValidatorsEvents,
  getValidatorList,
  getPastEvents,
  getDeployedAtBlock,
  normalizeGasPrice,
  gasPriceFromSupplier,
  gasPriceFromContract,
  gasPriceWithinLimits
}
