async function getTokensState(bridgeContract) {
  const context = {}
  context.bridgeableTokenAddress = await bridgeContract.methods.erc20token().call()
  try {
    const halfDuplexErc20tokenAddress = await bridgeContract.methods.halfDuplexErc20token().call()
    if (halfDuplexErc20tokenAddress !== context.bridgeableTokenAddress) {
      context.halfDuplexTokenAddress = halfDuplexErc20tokenAddress
    } else {
      context.idle = true
    }
  } catch (e) {
    context.idle = true
  }

  return context
}

module.exports = {
  getTokensState
}
