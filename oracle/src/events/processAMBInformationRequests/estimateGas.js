const { HttpListProviderError } = require('../../services/HttpListProvider')
const { AlreadyProcessedError, AlreadySignedError, InvalidValidatorError } = require('../../utils/errors')
const logger = require('../../services/logger').child({
  module: 'processInformationRequests:estimateGas'
})
const { strip0x } = require('../../../../commons')
const { AMB_AFFIRMATION_REQUEST_EXTRA_GAS_ESTIMATOR: estimateExtraGas } = require('../../utils/constants')

async function estimateGas({ web3, homeBridge, validatorContract, messageId, status, result, address }) {
  try {
    const gasEstimate = await homeBridge.methods.confirmInformation(messageId, status, result).estimateGas({
      from: address
    })

    // message length in bytes
    const len = strip0x(result).length / 2

    const callbackGasLimit = parseInt(await homeBridge.methods.maxGasPerTx().call(), 10)

    return gasEstimate + callbackGasLimit + estimateExtraGas(len)
  } catch (e) {
    if (e instanceof HttpListProviderError) {
      throw e
    }

    const messageHash = web3.utils.soliditySha3(messageId, status, result)
    const senderHash = web3.utils.soliditySha3(address, messageHash)

    // Check if minimum number of validations was already reached
    logger.debug('Check if minimum number of validations was already reached')
    const numAffirmationsSigned = await homeBridge.methods.numAffirmationsSigned(messageHash).call()
    const alreadyProcessed = await homeBridge.methods.isAlreadyProcessed(numAffirmationsSigned).call()

    if (alreadyProcessed) {
      throw new AlreadyProcessedError(e.message)
    }

    // Check if the message was already signed by this validator
    logger.debug('Check if the message was already signed')
    const alreadySigned = await homeBridge.methods.affirmationsSigned(senderHash).call()

    if (alreadySigned) {
      throw new AlreadySignedError(e.message)
    }

    // Check if address is validator
    logger.debug('Check if address is a validator')
    const isValidator = await validatorContract.methods.isValidator(address).call()

    if (!isValidator) {
      throw new InvalidValidatorError(`${address} is not a validator`)
    }

    throw new Error('Unknown error while processing message')
  }
}

module.exports = estimateGas
