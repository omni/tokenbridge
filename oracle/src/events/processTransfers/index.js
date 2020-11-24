require('../../../env')
const promiseLimit = require('promise-limit')
const { HttpListProviderError } = require('../../services/HttpListProvider')
const { BRIDGE_VALIDATORS_ABI, ZERO_ADDRESS } = require('../../../../commons')
const rootLogger = require('../../services/logger')
const { web3Home, web3Foreign } = require('../../services/web3')
const { AlreadyProcessedError, AlreadySignedError, InvalidValidatorError } = require('../../utils/errors')
const { EXIT_CODES, MAX_CONCURRENT_EVENTS } = require('../../utils/constants')
const estimateGas = require('../processAffirmationRequests/estimateGas')

const limit = promiseLimit(MAX_CONCURRENT_EVENTS)

let validatorContract = null

function processTransfersBuilder(config) {
  const homeBridge = new web3Home.eth.Contract(config.homeBridgeAbi, config.homeBridgeAddress)
  const userRequestForAffirmationAbi = config.foreignBridgeAbi.filter(
    e => e.type === 'event' && e.name === 'UserRequestForAffirmation'
  )[0]
  const tokensSwappedAbi = config.foreignBridgeAbi.filter(e => e.type === 'event' && e.name === 'TokensSwapped')[0]
  const userRequestForAffirmationHash = web3Home.eth.abi.encodeEventSignature(userRequestForAffirmationAbi)
  const tokensSwappedHash = tokensSwappedAbi ? web3Home.eth.abi.encodeEventSignature(tokensSwappedAbi) : '0x'

  return async function processTransfers(transfers) {
    const txToSend = []

    if (validatorContract === null) {
      rootLogger.debug('Getting validator contract address')
      const validatorContractAddress = await homeBridge.methods.validatorContract().call()
      rootLogger.debug({ validatorContractAddress }, 'Validator contract address obtained')

      validatorContract = new web3Home.eth.Contract(BRIDGE_VALIDATORS_ABI, validatorContractAddress)
    }

    rootLogger.debug(`Processing ${transfers.length} Transfer events`)
    const callbacks = transfers
      .map(transfer => async () => {
        const { from, value } = transfer.returnValues

        const logger = rootLogger.child({
          eventTransactionHash: transfer.transactionHash
        })

        logger.info({ from, value }, `Processing transfer ${transfer.transactionHash}`)

        const receipt = await web3Foreign.eth.getTransactionReceipt(transfer.transactionHash)

        const existsAffirmationEvent = receipt.logs.some(
          e => e.address === config.foreignBridgeAddress && e.topics[0] === userRequestForAffirmationHash
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
          ? receipt.logs.some(e => e.address === config.foreignBridgeAddress && e.topics[0] === tokensSwappedHash)
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
            web3: web3Home,
            homeBridge,
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

        const data = await homeBridge.methods
          .executeAffirmation(from, value, transfer.transactionHash)
          .encodeABI({ from: config.validatorAddress })

        txToSend.push({
          data,
          gasEstimate,
          transactionReference: transfer.transactionHash,
          to: config.homeBridgeAddress
        })
      })
      .map(promise => limit(promise))

    await Promise.all(callbacks)
    return txToSend
  }
}

module.exports = processTransfersBuilder
