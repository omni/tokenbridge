async function call(config, informationRequest, foreignBlock) {
  const { foreign } = config

  const { data } = informationRequest.returnValues

  const address = foreign.web3.eth.abi.decodeParameter('address', data)

  const nonce = await foreign.web3.eth.getTransactionCount(address, foreignBlock.number)

  return [true, foreign.web3.eth.abi.encodeParameter('uint256', nonce)]
}

module.exports = {
  'eth_getTransactionCount(address)': call
}
