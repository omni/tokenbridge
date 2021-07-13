const { toBN } = require('web3').utils

const { ASYNC_CALL_ERRORS } = require('../../../utils/constants')
const { serializeBlock } = require('./serializers')

async function call(web3, data, foreignBlock) {
  const blockNumber = web3.eth.abi.decodeParameter('uint256', data)

  if (toBN(blockNumber).gt(toBN(foreignBlock.number))) {
    return [false, ASYNC_CALL_ERRORS.BLOCK_IS_IN_THE_FUTURE]
  }

  const block = await web3.eth.getBlock(blockNumber)

  return [true, serializeBlock(web3, block)]
}

module.exports = {
  'eth_getBlockByNumber()': async (web3, _, block) => [true, serializeBlock(web3, block)],
  'eth_getBlockByNumber(uint256)': call
}
