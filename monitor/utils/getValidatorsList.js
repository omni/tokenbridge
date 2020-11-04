const { REWARDABLE_VALIDATORS_ABI, processValidatorsEvents } = require('../../commons')
const { getPastEvents } = require('./web3Cache')

const VALIDATORS_INDEXED_EVENTS_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'validator',
        type: 'address'
      }
    ],
    name: 'ValidatorRemoved',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'validator',
        type: 'address'
      }
    ],
    name: 'ValidatorAdded',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'validator',
        type: 'address'
      },
      {
        indexed: true,
        name: 'reward',
        type: 'address'
      }
    ],
    name: 'ValidatorAdded',
    type: 'event'
  }
]

const tryCall = async (method, fallbackValue) => {
  try {
    return await method.call()
  } catch (e) {
    return fallbackValue
  }
}

const getValidatorList = async (address, eth, options) => {
  const { logger } = options
  logger.debug('getting validatorList')

  const validatorsContract = new eth.Contract(REWARDABLE_VALIDATORS_ABI, address) // in monitor, BRIDGE_VALIDATORS_ABI was used
  const validators = await tryCall(validatorsContract.methods.validatorList(), [])

  if (validators.length) {
    return validators
  }

  logger.debug('getting validatorsEvents')

  options.fromBlock = Number(await tryCall(validatorsContract.methods.deployedAtBlock(), 0))

  const contract = new eth.Contract(VALIDATORS_INDEXED_EVENTS_ABI, address)

  const validatorsEvents = [
    ...(await getPastEvents(contract, {
      event: 'ValidatorAdded(address)',
      ...options
    })),
    ...(await getPastEvents(contract, {
      event: 'ValidatorAdded(address,address)',
      ...options
    })),
    ...(await getPastEvents(contract, {
      event: 'ValidatorRemoved(address)',
      ...options
    }))
  ].sort((a, b) => a.blockNumber - b.blockNumber || a.transactionIndex - b.transactionIndex)

  return processValidatorsEvents(validatorsEvents)
}

module.exports = {
  getValidatorList
}
