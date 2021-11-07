const { ASYNC_CALL_ERRORS } = require('../../../utils/constants')
const { serializeTx } = require('./serializers')

async function call(web3, data, foreignBlock) {
  const hash = web3.eth.abi.decodeParameter('bytes32', data)

  const tx = await web3.eth.getTransaction(hash)

  if (tx === null || tx.blockNumber > foreignBlock.number) {
    return [false, ASYNC_CALL_ERRORS.NOT_FOUND]
  }

  return [true, serializeTx(web3, tx)]
}

module.exports = {
  'eth_getTransactionByHash(bytes32)': call
}
