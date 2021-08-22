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

  const userRequestForAffirmationHash = web3.eth.abi.encodeEventSignature('UserRequestForAffirmation(address,uint256)')
  const redeemHash = web3.eth.abi.encodeEventSignature('Redeem(address,uint256,uint256)')
  const transferHash = web3.eth.abi.encodeEventSignature('Transfer(address,address,uint256)')

  const foreignBridgeAddress = config.foreign.bridgeAddress

  const decodeAddress = data => web3.eth.abi.decodeParameter('address', data)

  const isUserRequestForAffirmation = e =>
    e.address.toLowerCase() === foreignBridgeAddress.toLowerCase() && e.topics[0] === userRequestForAffirmationHash
  const isRedeem = cTokenAddress => e =>
    e.address.toLowerCase() === cTokenAddress.toLowerCase() &&
    e.topics[0] === redeemHash &&
    decodeAddress(e.data.slice(0, 66)).toLowerCase() === foreignBridgeAddress.toLowerCase()
  const isCTokenTransfer = cTokenAddress => e =>
    e.address.toLowerCase() === cTokenAddress.toLowerCase() &&
    e.topics[0] === transferHash &&
    decodeAddress(e.topics[1]).toLowerCase() === foreignBridgeAddress.toLowerCase() &&
    decodeAddress(e.topics[2]).toLowerCase() === cTokenAddress.toLowerCase()

  let validatorContract = null

  return async function processTransfers(transfers) {
    const txToSend = []

    if (validatorContract === null) {
      validatorContract = await getValidatorContract(bridgeContract, web3)
    }

    rootLogger.debug(`Processing ${transfers.length} Transfer events`)
    const callbacks = transfers
      .map(transfer => async () => {
        const { from, to, value } = transfer.returnValues

        const logger = rootLogger.child({
          eventTransactionHash: transfer.transactionHash,
          from,
          to,
          value
        })

        logger.info('Processing transfer')

        const receipt = await config.foreign.web3.eth.getTransactionReceipt(transfer.transactionHash)

        if (receipt.logs.some(isUserRequestForAffirmation)) {
          logger.info('Transfer event discarded because affirmation is detected in the same transaction')
          return
        }

        if (from === ZERO_ADDRESS) {
          logger.info('Mint-like transfers from zero address are not processed')
          return
        }

        // when bridge performs a withdrawal from Compound, the following three events occur
        // * token.Transfer(from=cToken, to=bridge, amount=X)
        // * cToken.Redeem(redeemer=bridge, amount=X, tokens=Y)
        // * cToken.Transfer(from=bridge, to=cToken, amount=Y)
        if (receipt.logs.some(isRedeem(from)) && receipt.logs.some(isCTokenTransfer(from))) {
          logger.info('Transfer event discarded because cToken redeem is detected in the same transaction')
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
