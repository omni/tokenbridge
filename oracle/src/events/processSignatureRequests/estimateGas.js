const { HttpListProviderError } = require('../../services/HttpListProvider')
const { AlreadyProcessedError, AlreadySignedError, InvalidValidatorError } = require('../../utils/errors')
const logger = require('../../services/logger').child({
  module: 'processSignatureRequests:estimateGas'
})

async function estimateGas({ web3, homeBridge, validatorContract, signature, message, address }) {
  try {
    const gasEstimate = await homeBridge.methods.submitSignature(signature, message).estimateGas({
      from: address
    })
    return gasEstimate
  } catch (e) {
    if (e instanceof HttpListProviderError) {
      throw e
    }

    // Check if minimum number of validations was already reached
    logger.debug('Check if minimum number of validations was reached')
    const messageHash = web3.utils.soliditySha3(message)
    const numMessagesSigned = await homeBridge.methods.numMessagesSigned(messageHash).call()
    const alreadyProcessed = await homeBridge.methods.isAlreadyProcessed(numMessagesSigned).call()

    if (alreadyProcessed) {
      throw new AlreadyProcessedError(e.message)
    }

    // Check if transaction was already signed by this validator
    logger.debug('Check if transaction was already signed')
    const validatorMessageHash = web3.utils.soliditySha3(address, web3.utils.soliditySha3(message))
    const alreadySigned = await homeBridge.methods.messagesSigned(validatorMessageHash).call()

    if (alreadySigned) {
      throw new AlreadySignedError(e.message)
    }

    // Check if address is validator
    logger.debug('Check if address is validator')
    const isValidator = await validatorContract.methods.isValidator(address).call()

    if (!isValidator) {
      throw new InvalidValidatorError(`${address} is not a validator`)
    }

    logger.error('Unrecognized error')
    throw new Error('Unknown error while processing message')
  }
}

module.exports = estimateGas
