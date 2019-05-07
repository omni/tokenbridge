function generateNewBlock(web3, address) {
  return web3.eth.sendTransaction({
    from: address,
    to: '0x0000000000000000000000000000000000000000',
    gasPrice: '1',
    gas: '21000',
    value: '1'
  })
}

module.exports = {
  generateNewBlock
}
