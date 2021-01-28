async function call(config, informationRequest, foreignBlock) {
  const { foreign } = config

  const { data } = informationRequest.returnValues

  const { 0: address, 1: slot } = foreign.web3.eth.abi.decodeParameters(['address', 'bytes32'], data)

  const value = await foreign.web3.eth.getStorageAt(address, slot, foreignBlock.number)

  return [true, foreign.web3.eth.abi.encodeParameter('bytes32', value)]
}

module.exports = {
  'eth_getStorageAt(address,bytes32)': call
}
