const { zipToObject } = require('../../../utils/utils')

const argTypes = {
  to: 'address',
  from: 'address',
  gas: 'uint256',
  data: 'bytes'
}

function makeCall(argNames) {
  return async function(config, informationRequest, foreignBlock) {
    const { foreign } = config

    const { data } = informationRequest.returnValues

    const types = argNames.map(name => argTypes[name])
    const args = foreign.web3.eth.abi.decodeParameters(types, data)
    const opts = zipToObject(argNames, args)

    const [status, result] = await foreign.web3.eth
      .call(opts, foreignBlock.number)
      .then(result => [true, result], err => [false, err.data])

    return [status, foreign.web3.eth.abi.encodeParameter('bytes', result)]
  }
}

module.exports = {
  'eth_call(address,bytes)': makeCall(['to', 'data']),
  'eth_call(address,address,bytes)': makeCall(['to', 'from', 'data']),
  'eth_call(address,uint256,bytes)': makeCall(['to', 'gas', 'data']),
  'eth_call(address,address,uint256,bytes)': makeCall(['to', 'from', 'gas', 'data'])
}
