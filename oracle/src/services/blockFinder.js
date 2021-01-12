require('../../env')
const rootLogger = require('./logger')

async function makeBlockFinder(name, web3) {
  const logger = rootLogger.child({
    module: `blockFinder-${name}`
  })

  logger.info('Estimating average block time')
  const lastBlock = await web3.eth.getBlock('latest')
  const oldBlock = await web3.eth.getBlock(Math.max(lastBlock.number - 10000, 1))
  const blockDiff = lastBlock.number - oldBlock.number
  const timeDiff = lastBlock.timestamp - oldBlock.timestamp
  const averageBlockTime = timeDiff / blockDiff
  logger.info(`Average block time among last ${blockDiff} blocks is ${averageBlockTime} seconds`)

  return async (timestamp, startingBlock) => {
    logger.info(`Searching for block with timestamp ${timestamp}, starting from block #${startingBlock.number}`)
    let currentBlock = startingBlock

    let requests = 0
    const getBlock = number => {
      requests++
      return web3.eth.getBlock(number)
    }

    let prevBlockDiff = Infinity
    while (true) {
      const timeDiff = currentBlock.timestamp - timestamp
      const blockDiff = Math.ceil(timeDiff / averageBlockTime)
      if (Math.abs(blockDiff) < 3 || Math.abs(blockDiff) >= Math.abs(prevBlockDiff)) {
        break
      }
      prevBlockDiff = blockDiff
      const blockNumber = currentBlock.number - blockDiff
      logger.debug(`Moving ${-blockDiff} blocks from #${currentBlock.number} to #${blockNumber}`)
      currentBlock = await getBlock(blockNumber)
    }

    if (currentBlock.timestamp < timestamp) {
      while (true) {
        logger.debug(`Checking next block #${currentBlock.number + 1}`)
        const nextBlock = await getBlock(currentBlock.number + 1)
        if (nextBlock.timestamp <= timestamp) {
          currentBlock = nextBlock
        } else {
          break
        }
      }
    } else if (currentBlock.timestamp > timestamp) {
      while (currentBlock.timestamp > timestamp) {
        logger.debug(`Checking previous block #${currentBlock.number - 1}`)
        currentBlock = await getBlock(currentBlock.number - 1)
      }
    }

    logger.info(
      `Found block #${currentBlock.number}, with timestamp ${
        currentBlock.timestamp
      }. Made a total of ${requests} eth_getBlockByNumber requests`
    )

    return currentBlock
  }
}

module.exports = makeBlockFinder
