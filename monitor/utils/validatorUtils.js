/* eslint no-param-reassign: ["error", { "props": false }] */

const { BRIDGE_VALIDATORS_ABI, processValidatorsEvents, validatorList } = require('../../commons')
const logger = require('../logger')('validatorsUtils')
const { getPastEvents } = require('./contract')

const getValidatorList = async (address, eth, fromBlock, toBlock) => {
  logger.debug('getting validatorList')
  const validatorsContract = new eth.Contract(BRIDGE_VALIDATORS_ABI, address)
  const validators = await validatorList(validatorsContract)

  if (validators.length) {
    return validators
  }

  logger.debug('getting validatorsEvents')
  const contract = new eth.Contract([], address)
  const validatorsEvents = await getPastEvents({
    contract,
    event: 'allEvents',
    fromBlock,
    toBlock,
    options: {}
  })

  return processValidatorsEvents(validatorsEvents)
}

module.exports = {
  getValidatorList
}
