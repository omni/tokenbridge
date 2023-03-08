const { ASYNC_CALL_ERRORS } = require('../../../utils/constants')
const { serializeBlock } = require('./serializers')

async function call(web3, data, foreignBlock) {
  const blockHash = web3.eth.abi.decodeParameter('bytes32', data).catch(() => {
    return [false, ASYNC_CALL_ERRORS.INPUT_DATA_HAVE_INCORRECT_FORMAT]
  })

  const block = await web3.eth.getBlock(blockHash)

  if (block === null || block.number > foreignBlock.number) {
    return [false, ASYNC_CALL_ERRORS.NOT_FOUND]
  }

  return [true, serializeBlock(web3, block)]
}

module.exports = {
  'eth_getBlockByHash(bytes32)': call
}
