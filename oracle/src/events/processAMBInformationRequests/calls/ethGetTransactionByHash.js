const { serializeTx } = require('./serializers')

async function call(web3, data, foreignBlock) {
  const hash = web3.eth.abi.decodeParameter('bytes32', data)

  const tx = await web3.eth.getTransaction(hash)

  if (tx === null || tx.blockNumber > foreignBlock.number) {
    return [false, '0x']
  }

  return [true, serializeTx(web3, tx)]
}

module.exports = {
  'eth_getTransactionByHash(bytes32)': call
}
