require('../../../env')
const promiseLimit = require('promise-limit')
const { HttpListProviderError } = require('../../services/HttpListProvider')
const rootLogger = require('../../services/logger')
const { getValidatorContract } = require('../../tx/web3')
const { createMessage } = require('../../utils/message')
const estimateGas = require('./estimateGas')
const { AlreadyProcessedError, AlreadySignedError, InvalidValidatorError } = require('../../utils/errors')
const { EXIT_CODES, MAX_CONCURRENT_EVENTS } = require('../../utils/constants')

const limit = promiseLimit(MAX_CONCURRENT_EVENTS)

function processSignatureRequestsBuilder(config) {
  const { bridgeContract, web3 } = config.home

  let expectedMessageLength = null
  let validatorContract = null

  return async function processSignatureRequests(signatureRequests) {
    const txToSend = []

    if (expectedMessageLength === null) {
      expectedMessageLength = await bridgeContract.methods.requiredMessageLength().call()
    }

    if (validatorContract === null) {
      validatorContract = await getValidatorContract(bridgeContract, web3)
    }

    rootLogger.debug(`Processing ${signatureRequests.length} SignatureRequest events`)
    const callbacks = signatureRequests
      .map(signatureRequest => async () => {
        const { recipient, value } = signatureRequest.returnValues

        const logger = rootLogger.child({
          eventTransactionHash: signatureRequest.transactionHash
        })

        logger.info({ sender: recipient, value }, `Processing signatureRequest ${signatureRequest.transactionHash}`)

        const message = createMessage({
          recipient,
          value,
          transactionHash: signatureRequest.transactionHash,
          bridgeAddress: config.foreign.bridgeAddress,
          expectedMessageLength
        })

        const signature = web3.eth.accounts.sign(message, config.validatorPrivateKey)

        let gasEstimate
        try {
          logger.debug('Estimate gas')
          gasEstimate = await estimateGas({
            web3,
            homeBridge: bridgeContract,
            validatorContract,
            signature: signature.signature,
            message,
            address: config.validatorAddress
          })
          logger.debug({ gasEstimate }, 'Gas estimated')
        } catch (e) {
          if (e instanceof HttpListProviderError) {
            throw new Error('RPC Connection Error: submitSignature Gas Estimate cannot be obtained.')
          } else if (e instanceof InvalidValidatorError) {
            logger.fatal({ address: config.validatorAddress }, 'Invalid validator')
            process.exit(EXIT_CODES.INCOMPATIBILITY)
          } else if (e instanceof AlreadySignedError) {
            logger.info(`Already signed signatureRequest ${signatureRequest.transactionHash}`)
            return
          } else if (e instanceof AlreadyProcessedError) {
            logger.info(
              `signatureRequest ${signatureRequest.transactionHash} was already processed by other validators`
            )
            return
          } else {
            logger.error(e, 'Unknown error while processing transaction')
            throw e
          }
        }

        const data = bridgeContract.methods.submitSignature(signature.signature, message).encodeABI()
        txToSend.push({
          data,
          gasEstimate,
          transactionReference: signatureRequest.transactionHash,
          to: config.home.bridgeAddress
        })
      })
      .map(promise => limit(promise))

    await Promise.all(callbacks)
    return txToSend
  }
}

module.exports = processSignatureRequestsBuilder
