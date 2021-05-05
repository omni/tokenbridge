const { serializeReceipt } = require('./serializers')

async function call(web3, data, foreignBlock) {
  const hash = web3.eth.abi.decodeParameter('bytes32', data)

  const receipt = await web3.eth.getTransactionReceipt(hash)

  if (receipt === null || receipt.blockNumber > foreignBlock.number) {
    return [false, '0x']
  }

  return [true, serializeReceipt(web3, receipt)]
}

module.exports = {
  'eth_getTransactionReceipt(bytes32)': call
}
