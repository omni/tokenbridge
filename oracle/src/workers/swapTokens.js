require('../../env')
const { HttpListProviderError } = require('http-list-provider')
const rootLogger = require('../services/logger')
const { web3Foreign } = require('../services/web3')

const { BRIDGE_VALIDATORS_ABI } = require('../../../commons')

let validatorContract = null

function swapTokensBuilder(config) {
  const foreignBridge = new web3Foreign.eth.Contract(config.foreignBridgeAbi, config.foreignBridgeAddress)

  return async function swapTokens(blockNumber) {
    const txToSend = []

    const logger = rootLogger.child({
      blockNumber: blockNumber.toString()
    })

    logger.debug(`Starting swap tokens operation`)

    if (validatorContract === null) {
      logger.debug('Getting validator contract address')
      const validatorContractAddress = await foreignBridge.methods.validatorContract().call()
      logger.debug({ validatorContractAddress }, 'Validator contract address obtained')

      validatorContract = new web3Foreign.eth.Contract(BRIDGE_VALIDATORS_ABI, validatorContractAddress)
    }

    logger.debug(`Checking if is validator duty`)
    const validatorDuty = await validatorContract.methods.isValidatorDuty(config.validatorAddress).call()

    if (!validatorDuty) {
      logger.info(`Token swap discarded because is not validator duty`)
      return txToSend
    }

    logger.debug(`Checking if half duplex balance if above the threshold`)
    const hdTokenBalanceAboveMinBalance = await foreignBridge.methods.isHDTokenBalanceAboveMinBalance().call()

    if (!hdTokenBalanceAboveMinBalance) {
      logger.info(`Token swap discarded because half duplex balance if below the threshold`)
      return txToSend
    }

    logger.debug(`Getting block`)
    const block = await web3Foreign.eth.getBlock(blockNumber)

    logger.debug(`Checking if SCD Emergency Shutdown has happened`)
    const tokenSwapAllowed = await foreignBridge.methods.isTokenSwapAllowed(block.timestamp).call()

    if (!tokenSwapAllowed) {
      logger.info(`Token swap discarded because SCD Emergency Shutdown has happened`)
      return txToSend
    }

    let gasEstimate

    try {
      logger.debug(`Estimate gas`)
      gasEstimate = await foreignBridge.methods.swapTokens().estimateGas({
        from: config.validatorAddress
      })

      logger.debug({ gasEstimate }, 'Gas estimated')
    } catch (e) {
      if (e instanceof HttpListProviderError) {
        const errorMsg = 'RPC Connection Error: swapTokens Gas Estimate cannot be obtained.'
        logger.error(e, errorMsg)
        throw new Error(errorMsg)
      } else {
        logger.error(e, 'Unknown error while processing transaction')
        throw e
      }
    }

    // generate data
    const data = await foreignBridge.methods.swapTokens().encodeABI()

    // push to job
    txToSend.push({
      data,
      gasEstimate,
      transactionReference: `swap tokens operation for block number ${blockNumber.toString()}`,
      to: config.foreignBridgeAddress
    })

    return txToSend
  }
}

module.exports = swapTokensBuilder
