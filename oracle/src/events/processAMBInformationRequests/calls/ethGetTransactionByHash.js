const { serializeTx } = require('./serializers')

async function call(config, informationRequest, foreignBlock) {
  const { foreign } = config

  const { data } = informationRequest.returnValues

  const hash = foreign.web3.eth.abi.decodeParameter('bytes32', data)

  const tx = await foreign.web3.eth.getTransaction(hash)

  if (tx === null || tx.blockNumber > foreignBlock.number) {
    return [false, '0x']
  }

  return [true, serializeTx(foreign.web3, tx)]
}

module.exports = {
  'eth_getTransactionByHash(bytes32)': call
}
