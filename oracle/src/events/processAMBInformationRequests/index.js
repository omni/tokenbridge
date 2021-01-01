require('dotenv').config()
const promiseLimit = require('promise-limit')
const { HttpListProviderError } = require('../../services/HttpListProvider')
const rootLogger = require('../../services/logger')
const makeBlockFinder = require('../../services/blockFinder')
const { EXIT_CODES, MAX_CONCURRENT_EVENTS, EXTRA_GAS_ABSOLUTE } = require('../../utils/constants')
const estimateGas = require('./estimateGas')
const { getValidatorContract } = require('../../tx/web3')
const { AlreadyProcessedError, AlreadySignedError, InvalidValidatorError } = require('../../utils/errors')

const limit = promiseLimit(MAX_CONCURRENT_EVENTS)

function processInformationRequestsBuilder(config) {
  const { home, foreign } = config

  let validatorContract = null
  let blockFinder = null

  return async function processInformationRequests(informationRequests, lastForeignBlock) {
    const txToSend = []

    if (validatorContract === null) {
      validatorContract = await getValidatorContract(home.bridgeContract, home.web3)
    }

    if (blockFinder === null) {
      rootLogger.debug('Initializing block finder')
      blockFinder = await makeBlockFinder('foreign', foreign.web3)
    }

    let closestForeignBlock

    if (informationRequests.length > 0) {
      closestForeignBlock = await blockFinder(informationRequests[0].returnValues.timestamp, lastForeignBlock)
    }

    rootLogger.debug(`Processing ${informationRequests.length} UserRequestForInformation events`)
    const callbacks = informationRequests
      .map(informationRequest => async () => {
        const { messageId, executor, data, from, gas } = informationRequest.returnValues

        const logger = rootLogger.child({
          eventTransactionHash: informationRequest.transactionHash,
          eventMessageId: messageId
        })

        const [status, result] = await foreign.web3.eth
          .call(
            {
              from,
              to: executor,
              data,
              gas
            },
            closestForeignBlock.number
          )
          .then(result => [true, result], err => [false, err.data])

        let gasEstimate
        try {
          logger.debug('Estimate gas')
          gasEstimate = await estimateGas({
            web3: home.web3,
            homeBridge: home.bridgeContract,
            validatorContract,
            messageId,
            status,
            result,
            address: config.validatorAddress
          })
          logger.debug({ gasEstimate }, 'Gas estimated')
        } catch (e) {
          if (e instanceof HttpListProviderError) {
            throw new Error('RPC Connection Error: confirmInformation Gas Estimate cannot be obtained.')
          } else if (e instanceof InvalidValidatorError) {
            logger.fatal({ address: config.validatorAddress }, 'Invalid validator')
            process.exit(EXIT_CODES.INCOMPATIBILITY)
          } else if (e instanceof AlreadySignedError) {
            logger.info(`Already signed informationRequest ${messageId}`)
            return
          } else if (e instanceof AlreadyProcessedError) {
            logger.info(`informationRequest ${messageId} was already processed by other validators`)
            return
          } else {
            logger.error(e, 'Unknown error while processing transaction')
            throw e
          }
        }

        const confirmationData = home.bridgeContract.methods.confirmInformation(messageId, status, result).encodeABI()
        txToSend.push({
          data: confirmationData,
          gasEstimate,
          extraGas: EXTRA_GAS_ABSOLUTE,
          transactionReference: informationRequest.transactionHash,
          to: config.home.bridgeAddress
        })
      })
      .map(promise => limit(promise))

    await Promise.all(callbacks)
    return txToSend
  }
}

module.exports = processInformationRequestsBuilder
