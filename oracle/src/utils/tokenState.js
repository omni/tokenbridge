async function getTokensState(bridgeContract) {
  const context = {}
  try {
    logger.debug('Getting bridgeable token address')
    context.bridgeableTokenAddress = await bridgeContract.methods.erc20token().call()
    logger.debug({ address: context.bridgeableTokenAddress }, 'Token address obtained')
  } catch (e) {
    throw new Error(`Bridgeable token address cannot be obtained`)
  }

  try {
    logger.debug('Getting Half Duplex token address')
    const halfDuplexErc20tokenAddress = await bridgeContract.methods.halfDuplexErc20token().call()
    logger.debug({ address: halfDuplexErc20tokenAddress }, 'Half Duplex token address obtained')
    if (halfDuplexErc20tokenAddress !== context.bridgeableTokenAddress) {
      context.halfDuplexTokenAddress = halfDuplexErc20tokenAddress
    } else {
      logger.info('Migration to support two tokens was not applied')
      context.idle = true
    }
  } catch (e) {
    logger.info('Old version of contracts is used')
    context.idle = true
  }

  return context
}

module.exports = {
  getTokensState
}
