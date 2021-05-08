const logger = require('../services/logger').child({
  module: 'web3'
})
const { BRIDGE_VALIDATORS_ABI } = require('../../../commons')

async function getNonce(web3, address) {
  try {
    logger.debug({ address }, 'Getting transaction count')
    const transactionCount = await web3.eth.getTransactionCount(address)
    logger.debug({ address, transactionCount }, 'Transaction count obtained')
    return transactionCount
  } catch (e) {
    logger.error(e.message)
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
    logger.error(e.message)
    throw new Error(`Block Number cannot be obtained`)
  }
}

async function getBlock(web3, number) {
  try {
    logger.debug(`Getting block ${number.toString()}`)
    const block = await web3.eth.getBlock(number)
    logger.debug({ number: block.number, timestamp: block.timestamp, hash: block.hash }, 'Block obtained')
    return block
  } catch (e) {
    logger.error(e.message)
    throw new Error(`Block cannot be obtained`)
  }
}

async function getChainId(web3) {
  try {
    logger.debug('Getting chain id')
    const chainId = await web3.eth.getChainId()
    logger.debug({ chainId }, 'Chain id obtained')
    return chainId
  } catch (e) {
    logger.error(e.message)
    throw new Error(`Chain Id cannot be obtained`)
  }
}

async function getRequiredBlockConfirmations(contract) {
  try {
    const contractAddress = contract.options.address
    logger.debug({ contractAddress }, 'Getting required block confirmations')
    const requiredBlockConfirmations = parseInt(await contract.methods.requiredBlockConfirmations().call(), 10)
    logger.debug({ contractAddress, requiredBlockConfirmations }, 'Required block confirmations obtained')
    return requiredBlockConfirmations
  } catch (e) {
    logger.error(e.message)
    throw new Error(`Required block confirmations cannot be obtained`)
  }
}

async function getValidatorContract(contract, web3) {
  try {
    const contractAddress = contract.options.address
    logger.debug({ contractAddress }, 'Getting validator contract address')
    const validatorContractAddress = await contract.methods.validatorContract().call()
    logger.debug({ contractAddress, validatorContractAddress }, 'Validator contract address obtained')

    return new web3.eth.Contract(BRIDGE_VALIDATORS_ABI, validatorContractAddress)
  } catch (e) {
    logger.error(e.message)
    throw new Error(`Validator cannot be obtained`)
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
    logger.error(e.message)
    throw new Error(`${event} events cannot be obtained`)
  }
}

async function getEventsFromTx({ web3, contract, event, txHash, filter }) {
  try {
    const contractAddress = contract.options.address
    logger.info({ contractAddress, event, txHash }, 'Getting past events for specific transaction')
    const { logs } = await web3.eth.getTransactionReceipt(txHash)
    const eventAbi = contract.options.jsonInterface.find(abi => abi.name === event)
    const decodeAbi = contract._decodeEventABI.bind(eventAbi)
    const pastEvents = logs
      .filter(event => event.topics[0] === eventAbi.signature)
      .map(decodeAbi)
      .filter(event =>
        eventAbi.inputs.every(arg => {
          const encodeParam = param => web3.eth.abi.encodeParameter(arg.type, param)
          return !filter[arg.name] || encodeParam(filter[arg.name]) === encodeParam(event.returnValues[arg.name])
        })
      )
    logger.debug({ contractAddress, event, count: pastEvents.length }, 'Past events obtained')
    return pastEvents
  } catch (e) {
    logger.error(e.message)
    throw new Error(`${event} events cannot be obtained`)
  }
}

module.exports = {
  getNonce,
  getBlockNumber,
  getBlock,
  getChainId,
  getRequiredBlockConfirmations,
  getValidatorContract,
  getEvents,
  getEventsFromTx
}
