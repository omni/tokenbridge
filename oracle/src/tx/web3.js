const logger = require('../services/logger').child({
  module: 'web3'
})
const { sendRawTx } = require('./sendTx')
const { hexToNumber } = require('web3-utils')

async function getNonce(web3, address) {
  try {
    logger.debug({ address }, 'Getting transaction count')
    const transactionCount = await web3.eth.getTransactionCount(address)
    logger.debug({ address, transactionCount }, 'Transaction count obtained')
    return transactionCount
  } catch (e) {
    throw new Error(`Nonce cannot be obtained`)
  }
}

async function getBlockNumber(web3) {
  try {
    logger.debug('Getting block number')
    const blockNumber = await web3.eth.getBlockNumber()
    logger.debug({ blockNumber }, 'Block number obtained')
    return blockNumber
  } catch (e) {
    throw new Error(`Block Number cannot be obtained`)
  }
}

async function getChainId(chain) {
  try {
    logger.debug('Getting chain id')
    const chainIdHex = await sendRawTx({
      chain,
      method: 'eth_chainId',
      params: []
    })
    const chainId = hexToNumber(chainIdHex)
    logger.debug({ chainId }, 'Chain id obtained')
    return chainId
  } catch (e) {
    throw new Error(`Chain Id cannot be obtained`)
  }
}

async function getRequiredBlockConfirmations(contract) {
  try {
    const contractAddress = contract.options.address
    logger.debug({ contractAddress }, 'Getting required block confirmations')
    const requiredBlockConfirmations = await contract.methods.requiredBlockConfirmations().call()
    logger.debug(
      { contractAddress, requiredBlockConfirmations },
      'Required block confirmations obtained'
    )
    return requiredBlockConfirmations
  } catch (e) {
    throw new Error(`Required block confirmations cannot be obtained`)
  }
}

async function getEvents({ contract, event, fromBlock, toBlock, filter }) {
  try {
    const contractAddress = contract.options.address
    logger.info(
      { contractAddress, event, fromBlock: fromBlock.toString(), toBlock: toBlock.toString() },
      'Getting past events'
    )
    const pastEvents = await contract.getPastEvents(event, { fromBlock, toBlock, filter })
    logger.debug({ contractAddress, event, count: pastEvents.length }, 'Past events obtained')
    return pastEvents
  } catch (e) {
    throw new Error(`${event} events cannot be obtained`)
  }
}

module.exports = {
  getNonce,
  getBlockNumber,
  getChainId,
  getRequiredBlockConfirmations,
  getEvents
}
