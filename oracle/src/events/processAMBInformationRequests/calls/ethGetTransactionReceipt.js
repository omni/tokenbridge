const { serializeReceipt } = require('./serializers')

async function call(config, informationRequest, foreignBlock) {
  const { foreign } = config

  const { data } = informationRequest.returnValues

  const hash = foreign.web3.eth.abi.decodeParameter('bytes32', data)

  const receipt = await foreign.web3.eth.getTransactionReceipt(hash)

  if (receipt === null || receipt.blockNumber > foreignBlock.number) {
    return [false, '0x']
  }

  return [true, serializeReceipt(foreign.web3, receipt)]
}

module.exports = {
  'eth_getTransactionReceipt(bytes32)': call
}
