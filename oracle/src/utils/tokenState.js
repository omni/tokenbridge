async function getTokensState(bridgeContract, logger) {
  const context = {}
  try {
    logger.debug('Getting bridgeable token address')
    context.bridgeableTokenAddress = await bridgeContract.methods.erc20token().call()
    logger.debug({ address: context.bridgeableTokenAddress }, 'Token address obtained')
  } catch (e) {
    throw new Error(`Bridgeable token address cannot be obtained`)
  }

  return context
}

module.exports = {
  getTokensState
}
