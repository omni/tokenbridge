require('../../../env')
const promiseLimit = require('promise-limit')
const { HttpListProviderError } = require('../../services/HttpListProvider')
const rootLogger = require('../../services/logger')
const { getValidatorContract } = require('../../tx/web3')
const { EXIT_CODES, MAX_CONCURRENT_EVENTS } = require('../../utils/constants')
const estimateGas = require('./estimateGas')
const { AlreadyProcessedError, AlreadySignedError, InvalidValidatorError } = require('../../utils/errors')

const limit = promiseLimit(MAX_CONCURRENT_EVENTS)

function processAffirmationRequestsBuilder(config) {
  const { bridgeContract, web3 } = config.home

  let validatorContract = null

  return async function processAffirmationRequests(affirmationRequests) {
    const txToSend = []

    if (validatorContract === null) {
      validatorContract = await getValidatorContract(bridgeContract, web3)
    }

    rootLogger.debug(`Processing ${affirmationRequests.length} AffirmationRequest events`)
    const callbacks = affirmationRequests
      .map(affirmationRequest => async () => {
        const { recipient, value } = affirmationRequest.returnValues

        const logger = rootLogger.child({
          eventTransactionHash: affirmationRequest.transactionHash
        })

        logger.info({ sender: recipient, value }, `Processing affirmationRequest ${affirmationRequest.transactionHash}`)

        let gasEstimate
        try {
          logger.debug('Estimate gas')
          gasEstimate = await estimateGas({
            web3,
            homeBridge: bridgeContract,
            validatorContract,
            recipient,
            value,
            txHash: affirmationRequest.transactionHash,
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
            logger.info(`Already signed affirmationRequest ${affirmationRequest.transactionHash}`)
            return
          } else if (e instanceof AlreadyProcessedError) {
            logger.info(
              `affirmationRequest ${affirmationRequest.transactionHash} was already processed by other validators`
            )
            return
          } else {
            logger.error(e, 'Unknown error while processing transaction')
            throw e
          }
        }

        const data = bridgeContract.methods
          .executeAffirmation(recipient, value, affirmationRequest.transactionHash)
          .encodeABI()
        txToSend.push({
          data,
          gasEstimate,
          transactionReference: affirmationRequest.transactionHash,
          to: config.home.bridgeAddress
        })
      })
      .map(promise => limit(promise))

    await Promise.all(callbacks)
    return txToSend
  }
}

module.exports = processAffirmationRequestsBuilder
