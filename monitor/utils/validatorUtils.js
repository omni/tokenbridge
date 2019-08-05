/* eslint no-param-reassign: ["error", { "props": false }] */

const { getValidatorListX } = require('../../commons')
const logger = require('../logger')('validatorsUtils')

const getValidatorList = async (address, eth, fromBlock, toBlock) => {
  const options = {
    logger,
    fromBlock,
    toBlock
  }

  return getValidatorListX(address, eth, options)
}

module.exports = {
  getValidatorList
}
