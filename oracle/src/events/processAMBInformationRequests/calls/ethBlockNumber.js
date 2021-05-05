module.exports = {
  'eth_blockNumber()': async (web3, _, block) => [true, web3.eth.abi.encodeParameter('uint256', block.number)]
}
