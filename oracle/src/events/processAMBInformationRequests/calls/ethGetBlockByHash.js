const { serializeBlock } = require('./serializers')

async function call(web3, data, foreignBlock) {
  const blockHash = web3.eth.abi.decodeParameter('bytes32', data)

  const block = await web3.eth.getBlock(blockHash)

  if (block === null || block.number > foreignBlock.number) {
    return [false, '0x']
  }

  return [true, serializeBlock(web3, block)]
}

module.exports = {
  'eth_getBlockByHash(bytes32)': call
}
