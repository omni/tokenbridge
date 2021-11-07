const { toBN } = require('web3').utils

const { ASYNC_CALL_ERRORS } = require('../../../utils/constants')

async function call(web3, data, foreignBlock) {
  const { 0: address, 1: slot } = web3.eth.abi.decodeParameters(['address', 'bytes32'], data)

  const value = await web3.eth.getStorageAt(address, slot, foreignBlock.number)

  return [true, web3.eth.abi.encodeParameter('bytes32', value)]
}

async function callArchive(web3, data, foreignBlock) {
  const { 0: address, 1: slot, 2: blockNumber } = web3.eth.abi.decodeParameters(['address', 'bytes32', 'uint256'], data)

  if (toBN(blockNumber).gt(toBN(foreignBlock.number))) {
    return [false, ASYNC_CALL_ERRORS.BLOCK_IS_IN_THE_FUTURE]
  }

  const value = await web3.eth.getStorageAt(address, slot, blockNumber)

  return [true, web3.eth.abi.encodeParameter('bytes32', value)]
}

module.exports = {
  'eth_getStorageAt(address,bytes32)': call,
  'eth_getStorageAt(address,bytes32,uint256)': callArchive
}
