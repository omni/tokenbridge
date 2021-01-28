async function call(config, informationRequest, foreignBlock) {
  const { foreign } = config

  const { data } = informationRequest.returnValues

  const address = foreign.web3.eth.abi.decodeParameter('address', data)

  const balance = await foreign.web3.eth.getBalance(address, foreignBlock.number)

  return [true, foreign.web3.eth.abi.encodeParameter('uint256', balance)]
}

module.exports = {
  'eth_getBalance(address)': call
}
