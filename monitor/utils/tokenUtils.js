let beforeESBiggestBlockNumber = 0

/**
 *
 * Returns true if the event was before the Emergency Shutdown.
 * The method has an optimization to avoid making request if a bigger block number is confirmed
 * to be before the ES. Events should be iterated from newer to older order to use the optimization.
 */
async function transferBeforeES(event, web3Foreign, foreignBridge) {
  const { blockNumber } = event

  if (blockNumber < beforeESBiggestBlockNumber) {
    return true
  }

  const block = await web3Foreign.eth.getBlock(blockNumber)

  const tokenSwapAllowed = await foreignBridge.methods.isTokenSwapAllowed(block.timestamp).call()
  if (tokenSwapAllowed) {
    beforeESBiggestBlockNumber = blockNumber
  }
  return tokenSwapAllowed
}

async function filterTransferBeforeES(array, web3Foreign, foreignBridge) {
  const newArray = []
  // Iterate events from newer to older
  for (let i = array.length - 1; i >= 0; i--) {
    const beforeES = await transferBeforeES(array[i], web3Foreign, foreignBridge)
    if (beforeES) {
      // add element to first position so the new array will have the same order
      newArray.unshift(array[i])
    }
  }
  return newArray
}

module.exports = {
  filterTransferBeforeES
}
