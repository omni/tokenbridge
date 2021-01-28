async function call(config, informationRequest, foreignBlock) {
  return [true, config.foreign.web3.eth.abi.encodeParameter('uint256', foreignBlock.number)]
}

module.exports = {
  'eth_blockNumber()': call
}
