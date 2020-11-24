const Web3 = require('web3')
const { HttpListProviderError } = require('../../services/HttpListProvider')
const { AlreadyProcessedError, IncompatibleContractError, InvalidValidatorError } = require('../../utils/errors')
const logger = require('../../services/logger').child({
  module: 'processCollectedSignatures:estimateGas'
})
const { parseAMBHeader } = require('../../utils/message')

const web3 = new Web3()
const { toBN } = Web3.utils

async function estimateGas({
  foreignBridge,
  validatorContract,
  message,
  numberOfCollectedSignatures,
  v,
  r,
  s,
  signatures,
  messageId,
  address
}) {
  try {
    const gasEstimate = await foreignBridge.methods.executeSignatures(message, signatures).estimateGas({
      from: address
    })
    const msgGasLimit = parseAMBHeader(message).gasLimit

    // + estimateExtraGas(len)
    // is not needed here, since estimateGas will already take into account gas
    // needed for memory expansion, message processing, etc.
    return gasEstimate + msgGasLimit
  } catch (e) {
    if (e instanceof HttpListProviderError) {
      throw e
    }

    // check if the message was already processed
    logger.debug('Check if the message was already processed')
    const alreadyProcessed = await foreignBridge.methods.relayedMessages(messageId).call()
    if (alreadyProcessed) {
      throw new AlreadyProcessedError()
    }

    // check if the number of signatures is enough
    logger.debug('Check if number of signatures is enough')
    const requiredSignatures = await validatorContract.methods.requiredSignatures().call()
    if (toBN(requiredSignatures).gt(toBN(numberOfCollectedSignatures))) {
      throw new IncompatibleContractError('The number of collected signatures does not match')
    }

    // check if all the signatures were made by validators
    for (let i = 0; i < v.length; i++) {
      const address = web3.eth.accounts.recover(message, `0x${v[i]}`, `0x${r[i]}`, `0x${s[i]}`)
      logger.debug({ address }, 'Check that signature is from a validator')
      const isValidator = await validatorContract.methods.isValidator(address).call()

      if (!isValidator) {
        throw new InvalidValidatorError(`Message signed by ${address} that is not a validator`)
      }
    }

    throw new Error('Unknown error while processing message')
  }
}

module.exports = estimateGas
