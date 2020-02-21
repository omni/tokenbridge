async function isChaiTokenEnabled(bridgeContract, logger) {
  logger.debug('Checking Chai availability')
  try {
    return await bridgeContract.methods.isChaiTokenEnabled().call()
  } catch (e) {
    logger.debug('Method isChaiTokenEnabled is not supported')
    return false
  }
}

module.exports = {
  isChaiTokenEnabled
}
