const { toBN } = require('web3').utils

const { ASYNC_CALL_ERRORS } = require('../../../utils/constants')
const { zipToObject } = require('../../../utils/utils')

const argTypes = {
  to: 'address',
  from: 'address',
  gas: 'uint256',
  data: 'bytes',
  blockNumber: 'uint256'
}

function makeCall(argNames) {
  return async function(web3, data, foreignBlock) {
    const types = argNames.map(name => argTypes[name])
    const args = web3.eth.abi.decodeParameters(types, data)
    const { blockNumber, ...opts } = zipToObject(argNames, args)

    if (blockNumber && toBN(blockNumber).gt(toBN(foreignBlock.number))) {
      return [false, ASYNC_CALL_ERRORS.BLOCK_IS_IN_THE_FUTURE]
    }

    return web3.eth
      .call(opts, blockNumber || foreignBlock.number)
      .then(result => [true, web3.eth.abi.encodeParameter('bytes', result)], () => [false, ASYNC_CALL_ERRORS.REVERT])
  }
}

module.exports = {
  'eth_call(address,bytes)': makeCall(['to', 'data']),
  'eth_call(address,bytes,uint256)': makeCall(['to', 'data', 'blockNumber']),
  'eth_call(address,address,bytes)': makeCall(['to', 'from', 'data']),
  'eth_call(address,address,bytes,uint256)': makeCall(['to', 'from', 'data', 'blockNumber']),
  'eth_call(address,uint256,bytes)': makeCall(['to', 'gas', 'data']),
  'eth_call(address,uint256,bytes,uint256)': makeCall(['to', 'gas', 'data', 'blockNumber']),
  'eth_call(address,address,uint256,bytes)': makeCall(['to', 'from', 'gas', 'data']),
  'eth_call(address,address,uint256,bytes,uint256)': makeCall(['to', 'from', 'gas', 'data', 'blockNumber'])
}
