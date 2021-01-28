const { serializeBlock } = require('./serializers')

async function call(config, informationRequest, foreignBlock) {
  const { foreign } = config

  const { data } = informationRequest.returnValues

  const blockHash = foreign.web3.eth.abi.decodeParameter('bytes32', data)

  const block = await foreign.web3.eth.getBlock(blockHash)

  if (block === null || block.number > foreignBlock.number) {
    return [false, '0x']
  }

  return [true, serializeBlock(foreign.web3, block)]
}

module.exports = {
  'eth_getBlockByHash(bytes32)': call
}
