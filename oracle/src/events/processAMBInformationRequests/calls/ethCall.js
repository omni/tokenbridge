const { toBN } = require('web3').utils

const { ASYNC_CALL_ERRORS, ASYNC_ETH_CALL_MAX_GAS_LIMIT } = require('../../../utils/constants')
const { zipToObject, isRevertError } = require('../../../utils/utils')

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

    // different clients might use different default gas limits, so it makes sense to limit it by some large number
    if (!opts.gas || toBN(opts.gas).gt(toBN(ASYNC_ETH_CALL_MAX_GAS_LIMIT))) {
      opts.gas = ASYNC_ETH_CALL_MAX_GAS_LIMIT
    }

    return web3.eth
      .call(opts, blockNumber || foreignBlock.number)
      .then(result => [true, web3.eth.abi.encodeParameter('bytes', result)])
      .catch(e => {
        if (isRevertError(e)) {
          return [false, ASYNC_CALL_ERRORS.REVERT]
        }
        throw e
      })
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
