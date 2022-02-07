require('dotenv').config()
const promiseLimit = require('promise-limit')
const { HttpListProviderError } = require('../../services/HttpListProvider')
const { getValidatorContract } = require('../../tx/web3')
const rootLogger = require('../../services/logger')
const { signatureToVRS, packSignatures } = require('../../utils/message')
const { readAccessListFile, isRevertError } = require('../../utils/utils')
const { parseAMBMessage } = require('../../../../commons')
const estimateGas = require('../processAMBCollectedSignatures/estimateGas')
const { AlreadyProcessedError, IncompatibleContractError, InvalidValidatorError } = require('../../utils/errors')
const { MAX_CONCURRENT_EVENTS, EXTRA_GAS_ABSOLUTE } = require('../../utils/constants')

const limit = promiseLimit(MAX_CONCURRENT_EVENTS)

const { ORACLE_HOME_TO_FOREIGN_ALLOWANCE_LIST, ORACLE_HOME_TO_FOREIGN_BLOCK_LIST } = process.env
const ORACLE_HOME_SKIP_MANUAL_LANE = process.env.ORACLE_HOME_SKIP_MANUAL_LANE === 'true'

function processCollectedSignaturesBuilder(config) {
  const { home, foreign, mevForeign } = config

  let validatorContract = null

  return async function processCollectedSignatures(signatures) {
    const txToSend = []

    if (validatorContract === null) {
      validatorContract = await getValidatorContract(foreign.bridgeContract, foreign.web3)
    }

    rootLogger.debug(`Processing ${signatures.length} CollectedSignatures events`)
    const callbacks = signatures
      .map(colSignature => async () => {
        const { messageHash, NumberOfCollectedSignatures } = colSignature.returnValues

        const logger = rootLogger.child({
          eventTransactionHash: colSignature.transactionHash
        })

        logger.info(`Processing CollectedSignatures ${colSignature.transactionHash}`)
        const message = await home.bridgeContract.methods.message(messageHash).call()
        const parsedMessage = parseAMBMessage(message)

        if (ORACLE_HOME_TO_FOREIGN_ALLOWANCE_LIST || ORACLE_HOME_TO_FOREIGN_BLOCK_LIST) {
          const sender = parsedMessage.sender.toLowerCase()
          const executor = parsedMessage.executor.toLowerCase()

          if (ORACLE_HOME_TO_FOREIGN_ALLOWANCE_LIST) {
            const allowanceList = await readAccessListFile(ORACLE_HOME_TO_FOREIGN_ALLOWANCE_LIST, logger)
            if (!allowanceList.includes(executor) && !allowanceList.includes(sender)) {
              logger.info(
                { sender, executor },
                'Validator skips a message. Neither sender nor executor addresses are in the allowance list.'
              )
              return
            }
          } else if (ORACLE_HOME_TO_FOREIGN_BLOCK_LIST) {
            const blockList = await readAccessListFile(ORACLE_HOME_TO_FOREIGN_BLOCK_LIST, logger)
            if (blockList.includes(executor)) {
              logger.info({ executor }, 'Validator skips a message. Executor address is in the block list.')
              return
            }
            if (blockList.includes(sender)) {
              logger.info({ sender }, 'Validator skips a message. Sender address is in the block list.')
              return
            }
          }
        }

        if (ORACLE_HOME_SKIP_MANUAL_LANE && parsedMessage.decodedDataType.manualLane) {
          logger.info(
            { dataType: parsedMessage.dataType },
            'Validator skips a message. Message was forwarded to the manual lane by the extension'
          )
          return
        }

        logger.debug({ NumberOfCollectedSignatures }, 'Number of signatures to get')

        const requiredSignatures = []
        requiredSignatures.length = NumberOfCollectedSignatures
        requiredSignatures.fill(0)

        const signaturesArray = []
        const [v, r, s] = [[], [], []]
        logger.debug('Getting message signatures')
        const signaturePromises = requiredSignatures.map(async (el, index) => {
          logger.debug({ index }, 'Getting message signature')
          const signature = await home.bridgeContract.methods.signature(messageHash, index).call()
          const vrs = signatureToVRS(signature)
          v.push(vrs.v)
          r.push(vrs.r)
          s.push(vrs.s)
          signaturesArray.push(vrs)
        })

        await Promise.all(signaturePromises)
        const signatures = packSignatures(signaturesArray)
        logger.info(`Processing messageId: ${parsedMessage.messageId}`)

        let gasEstimate
        try {
          logger.debug('Estimate gas')
          gasEstimate = await estimateGas({
            foreignBridge: foreign.bridgeContract,
            validatorContract,
            v,
            r,
            s,
            signatures,
            message,
            numberOfCollectedSignatures: NumberOfCollectedSignatures,
            messageId: parsedMessage.messageId,
            address: config.validatorAddress
          })
          logger.debug({ gasEstimate }, 'Gas estimated')
        } catch (e) {
          if (e instanceof HttpListProviderError) {
            throw new Error('RPC Connection Error: submitSignature Gas Estimate cannot be obtained.')
          } else if (e instanceof AlreadyProcessedError) {
            logger.info(`Already processed CollectedSignatures ${colSignature.transactionHash}`)
            return
          } else if (e instanceof IncompatibleContractError || e instanceof InvalidValidatorError) {
            logger.error(`The message couldn't be processed; skipping: ${e.message}`)
            return
          } else {
            logger.error(e, 'Unknown error while processing transaction')
            throw e
          }
        }

        const executeData = foreign.bridgeContract.methods.executeSignatures(message, signatures).encodeABI()
        const profit = await estimateProfit(
          mevForeign.contract,
          mevForeign.minGasPrice,
          executeData,
          mevForeign.flatMinerFee
        )
        if (profit === '0') {
          logger.error('No MEV opportunity found when testing with min gas price, skipping job')
          return
        }
        logger.info(`Estimated profit of ${profit} when simulating with ${mevForeign.minGasPrice} gas price`)

        txToSend.push({
          profit,
          executeData,
          data: mevForeign.contract.methods.execute(executeData).encodeABI(),
          gasEstimate,
          extraGas: EXTRA_GAS_ABSOLUTE,
          maxFeePerGas: mevForeign.maxFeePerGas,
          maxPriorityFeePerGas: mevForeign.maxPriorityFeePerGas,
          transactionReference: colSignature.transactionHash,
          to: mevForeign.contractAddress,
          value: mevForeign.flatMinerFee
        })
      })
      .map(promise => limit(promise))

    await Promise.all(callbacks)

    return txToSend
  }
}

async function estimateProfit(contract, gasPrice, data, minerFee) {
  return contract.methods
    .estimateProfit(gasPrice, data)
    .call({ value: minerFee })
    .then(
      res => res.toString(),
      e => {
        if (isRevertError(e)) {
          return '0'
        }
        throw e
      }
    )
}

module.exports = {
  processCollectedSignaturesBuilder,
  estimateProfit
}
