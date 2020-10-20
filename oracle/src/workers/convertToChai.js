require('../../env')
const { HttpListProviderError } = require('../services/HttpListProvider')
const rootLogger = require('../services/logger')
const { web3Foreign } = require('../services/web3')

const { BRIDGE_VALIDATORS_ABI } = require('../../../commons')

let validatorContract = null

function convertToChaiBuilder(config) {
  const foreignBridge = new web3Foreign.eth.Contract(config.foreignBridgeAbi, config.foreignBridgeAddress)
  return async function convertToChai(blockNumber) {
    const txToSend = []

    const logger = rootLogger.child({
      blockNumber: blockNumber.toString()
    })

    logger.debug(`Starting convert to chai operation`)

    if (validatorContract === null) {
      logger.debug('Getting validator contract address')
      const validatorContractAddress = await foreignBridge.methods.validatorContract().call()
      logger.debug({ validatorContractAddress }, 'Validator contract address obtained')

      validatorContract = new web3Foreign.eth.Contract(BRIDGE_VALIDATORS_ABI, validatorContractAddress)
    }

    logger.debug(`Checking if is validator duty`)
    const validatorDuty = await validatorContract.methods.isValidatorDuty(config.validatorAddress).call()

    if (!validatorDuty) {
      logger.info(`Convert to chai discarded because is not validator duty`)
      return txToSend
    }

    logger.debug(`Checking if dai token balance is above the threshold`)
    const daiNeedsToBeInvested = await foreignBridge.methods.isDaiNeedsToBeInvested().call()

    if (!daiNeedsToBeInvested) {
      logger.info(`Convert to chai discarded because dai balance is below the threshold or chai token is not set`)
      return txToSend
    }

    let gasEstimate

    try {
      logger.debug(`Estimate gas`)
      gasEstimate = await foreignBridge.methods.convertDaiToChai().estimateGas({
        from: config.validatorAddress
      })

      logger.debug({ gasEstimate }, 'Gas estimated')
    } catch (e) {
      if (e instanceof HttpListProviderError) {
        const errorMsg = 'RPC Connection Error: convertToChai Gas Estimate cannot be obtained.'
        logger.error(e, errorMsg)
        throw new Error(errorMsg)
      } else {
        logger.error(e, 'Unknown error while processing transaction')
        throw e
      }
    }

    // generate data
    const data = await foreignBridge.methods.convertDaiToChai().encodeABI()

    // push to job
    txToSend.push({
      data,
      gasEstimate,
      transactionReference: `convert to chai operation for block number ${blockNumber.toString()}`,
      to: config.foreignBridgeAddress
    })

    return txToSend
  }
}

module.exports = convertToChaiBuilder
