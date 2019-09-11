require('dotenv').config()
const { HttpListProviderError } = require('http-list-provider')
const promiseLimit = require('promise-limit')
const rootLogger = require('../../services/logger')
const { web3Home } = require('../../services/web3')
const bridgeValidatorsABI = require('../../../../contracts/build/contracts/BridgeValidators').abi
const { EXIT_CODES, MAX_CONCURRENT_EVENTS } = require('../../utils/constants')
const estimateGas = require('./estimateGas')
const { addTxHashToData, parseAMBMessage } = require('../../../../commons')
const { AlreadyProcessedError, AlreadySignedError, InvalidValidatorError } = require('../../utils/errors')

const limit = promiseLimit(MAX_CONCURRENT_EVENTS)

let validatorContract = null

function processAffirmationRequestsBuilder(config) {
  const homeBridge = new web3Home.eth.Contract(config.homeBridgeAbi, config.homeBridgeAddress)

  return async function processAffirmationRequests(affirmationRequests) {
    const txToSend = []

    if (validatorContract === null) {
      rootLogger.debug('Getting validator contract address')
      const validatorContractAddress = await homeBridge.methods.validatorContract().call()
      rootLogger.debug({ validatorContractAddress }, 'Validator contract address obtained')

      validatorContract = new web3Home.eth.Contract(bridgeValidatorsABI, validatorContractAddress)
    }

    rootLogger.debug(`Processing ${affirmationRequests.length} AffirmationRequest events`)
    const callbacks = affirmationRequests
      .map(affirmationRequest => async () => {
        const { encodedData } = affirmationRequest.returnValues

        const logger = rootLogger.child({
          eventTransactionHash: affirmationRequest.transactionHash
        })

        const message = addTxHashToData({
          encodedData,
          transactionHash: affirmationRequest.transactionHash
        })

        const { sender, executor } = parseAMBMessage(message)

        logger.info({ sender, executor }, `Processing affirmationRequest ${affirmationRequest.transactionHash}`)

        let gasEstimate
        try {
          logger.debug('Estimate gas')
          gasEstimate = await estimateGas({
            web3: web3Home,
            homeBridge,
            validatorContract,
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

        const data = await homeBridge.methods.executeAffirmation(message).encodeABI()

        txToSend.push({
          data,
          gasEstimate,
          transactionReference: affirmationRequest.transactionHash,
          to: config.homeBridgeAddress
        })
      })
      .map(promise => limit(promise))

    await Promise.all(callbacks)
    return txToSend
  }
}

module.exports = processAffirmationRequestsBuilder
