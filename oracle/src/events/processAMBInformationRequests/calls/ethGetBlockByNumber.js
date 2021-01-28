const { toBN } = require('web3').utils

const { serializeBlock } = require('./serializers')

async function call(config, informationRequest, foreignBlock) {
  const { foreign } = config

  const { data } = informationRequest.returnValues

  const blockNumber = foreign.web3.eth.abi.decodeParameter('uint256', data)

  if (toBN(blockNumber).gt(toBN(foreignBlock.number))) {
    return [false, '0x']
  }

  const block = await foreign.web3.eth.getBlock(blockNumber)

  return [true, serializeBlock(foreign.web3, block)]
}

module.exports = {
  'eth_getBlockByNumber()': async (config, _, block) => [true, serializeBlock(config.foreign.web3, block)],
  'eth_getBlockByNumber(uint256)': call
}
