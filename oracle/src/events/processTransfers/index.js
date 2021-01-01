require('../../../env')
const promiseLimit = require('promise-limit')
const { HttpListProviderError } = require('../../services/HttpListProvider')
const { ZERO_ADDRESS } = require('../../../../commons')
const rootLogger = require('../../services/logger')
const { getValidatorContract } = require('../../tx/web3')
const { AlreadyProcessedError, AlreadySignedError, InvalidValidatorError } = require('../../utils/errors')
const { EXIT_CODES, MAX_CONCURRENT_EVENTS } = require('../../utils/constants')
const estimateGas = require('../processAffirmationRequests/estimateGas')

const limit = promiseLimit(MAX_CONCURRENT_EVENTS)

function processTransfersBuilder(config) {
  const { bridgeContract, web3 } = config.home

  const userRequestForAffirmationAbi = config.foreign.bridgeABI.find(
    e => e.type === 'event' && e.name === 'UserRequestForAffirmation'
  )
  const tokensSwappedAbi = config.foreign.bridgeABI.find(e => e.type === 'event' && e.name === 'TokensSwapped')
  const userRequestForAffirmationHash = web3.eth.abi.encodeEventSignature(userRequestForAffirmationAbi)
  const tokensSwappedHash = tokensSwappedAbi ? web3.eth.abi.encodeEventSignature(tokensSwappedAbi) : '0x'

  let validatorContract = null

  return async function processTransfers(transfers) {
    const txToSend = []

    if (validatorContract === null) {
      validatorContract = await getValidatorContract(bridgeContract, web3)
    }

    rootLogger.debug(`Processing ${transfers.length} Transfer events`)
    const callbacks = transfers
      .map(transfer => async () => {
        const { from, value } = transfer.returnValues

        const logger = rootLogger.child({
          eventTransactionHash: transfer.transactionHash
        })

        logger.info({ from, value }, `Processing transfer ${transfer.transactionHash}`)

        const receipt = await config.foreign.web3.eth.getTransactionReceipt(transfer.transactionHash)

        const existsAffirmationEvent = receipt.logs.some(
          e => e.address === config.foreign.bridgeAddress && e.topics[0] === userRequestForAffirmationHash
        )

        if (existsAffirmationEvent) {
          logger.info(
            `Transfer event discarded because a transaction with alternative receiver detected in transaction ${
              transfer.transactionHash
            }`
          )
          return
        }

        const existsTokensSwappedEvent = tokensSwappedAbi
          ? receipt.logs.some(e => e.address === config.foreign.bridgeAddress && e.topics[0] === tokensSwappedHash)
          : false

        if (from === ZERO_ADDRESS && existsTokensSwappedEvent) {
          logger.info(
            `Transfer event discarded because token swap is detected in transaction ${transfer.transactionHash}`
          )
          return
        }

        let gasEstimate
        try {
          logger.debug('Estimate gas')
          gasEstimate = await estimateGas({
            web3,
            homeBridge: bridgeContract,
            validatorContract,
            recipient: from,
            value,
            txHash: transfer.transactionHash,
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
            logger.info(`Already signed transfer ${transfer.transactionHash}`)
            return
          } else if (e instanceof AlreadyProcessedError) {
            logger.info(`transfer ${transfer.transactionHash} was already processed by other validators`)
            return
          } else {
            logger.error(e, 'Unknown error while processing transaction')
            throw e
          }
        }

        const data = bridgeContract.methods.executeAffirmation(from, value, transfer.transactionHash).encodeABI()
        txToSend.push({
          data,
          gasEstimate,
          transactionReference: transfer.transactionHash,
          to: config.home.bridgeAddress
        })
      })
      .map(promise => limit(promise))

    await Promise.all(callbacks)
    return txToSend
  }
}

module.exports = processTransfersBuilder
