require('dotenv').config()
const promiseLimit = require('promise-limit')
const { soliditySha3 } = require('web3').utils
const { HttpListProviderError } = require('../../services/HttpListProvider')
const rootLogger = require('../../services/logger')
const makeBlockFinder = require('../../services/blockFinder')
const {
  EXIT_CODES,
  MAX_CONCURRENT_EVENTS,
  EXTRA_GAS_ABSOLUTE,
  ASYNC_CALL_ERRORS,
  MAX_ASYNC_CALL_RESULT_LENGTH
} = require('../../utils/constants')
const estimateGas = require('./estimateGas')
const { getValidatorContract, getBlock, getBlockNumber, getRequiredBlockConfirmations } = require('../../tx/web3')
const { AlreadyProcessedError, AlreadySignedError, InvalidValidatorError } = require('../../utils/errors')

const limit = promiseLimit(MAX_CONCURRENT_EVENTS)

const asyncCalls = {
  ...require('./calls/ethCall'),
  ...require('./calls/ethBlockNumber'),
  ...require('./calls/ethGetBlockByNumber'),
  ...require('./calls/ethGetBlockByHash'),
  ...require('./calls/ethGetTransactionByHash'),
  ...require('./calls/ethGetTransactionReceipt'),
  ...require('./calls/ethGetBalance'),
  ...require('./calls/ethGetTransactionCount'),
  ...require('./calls/ethGetStorageAt')
}

const asyncCallsSelectorsMapping = {}
Object.keys(asyncCalls).forEach(method => {
  asyncCallsSelectorsMapping[soliditySha3(method)] = method
})

function processInformationRequestsBuilder(config) {
  const { home, foreign, web3ForeignArchive } = config

  let validatorContract = null
  let blockFinder = null

  return async function processInformationRequests(informationRequests) {
    const txToSend = []

    if (validatorContract === null) {
      validatorContract = await getValidatorContract(home.bridgeContract, home.web3)
    }

    if (blockFinder === null) {
      rootLogger.debug('Initializing block finder')
      blockFinder = await makeBlockFinder('foreign', foreign.web3)
    }

    const foreignBlockNumber =
      (await getBlockNumber(foreign.web3)) - (await getRequiredBlockConfirmations(foreign.bridgeContract))
    const homeBlock = await getBlock(home.web3, informationRequests[0].blockNumber)
    const lastForeignBlock = await getBlock(foreign.web3, foreignBlockNumber)

    if (homeBlock.timestamp > lastForeignBlock.timestamp) {
      rootLogger.debug(
        { homeTimestamp: homeBlock.timestamp, foreignTimestamp: lastForeignBlock.timestamp },
        `Waiting for the closest foreign block to be confirmed`
      )
      return null
    }
    const foreignClosestBlock = await blockFinder(homeBlock.timestamp, lastForeignBlock)

    rootLogger.debug(`Processing ${informationRequests.length} UserRequestForInformation events`)
    const callbacks = informationRequests
      .map(informationRequest => async () => {
        const { messageId, requestSelector, data } = informationRequest.returnValues

        const logger = rootLogger.child({
          eventTransactionHash: informationRequest.transactionHash,
          eventMessageId: messageId
        })

        const asyncCallMethod = asyncCallsSelectorsMapping[requestSelector]

        if (!asyncCallMethod) {
          logger.warn({ requestSelector }, 'Unknown async request selector received')
          return
        }
        logger.info({ requestSelector, method: asyncCallMethod, data }, 'Processing async request')

        const call = asyncCalls[asyncCallMethod]
        let [status, result] = await call(web3ForeignArchive, data, foreignClosestBlock).catch(e => {
          if (e instanceof HttpListProviderError) {
            throw e
          }
          logger.error({ error: e.message }, 'Unknown error during async call execution')
          throw e
        })
        if (result.length > 2 + MAX_ASYNC_CALL_RESULT_LENGTH * 2) {
          status = false
          result = ASYNC_CALL_ERRORS.RESULT_IS_TOO_LONG
        }
        logger.info({ requestSelector, method: asyncCallMethod, status, result }, 'Request result obtained')

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
            address: config.validatorAddress,
            homeBlockNumber: homeBlock.number
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
