require('dotenv').config()
const promiseLimit = require('promise-limit')
const { HttpListProviderError } = require('../../services/HttpListProvider')
const bridgeValidatorsABI = require('../../../../contracts/build/contracts/BridgeValidators').abi
const rootLogger = require('../../services/logger')
const { web3Home, web3Foreign } = require('../../services/web3')
const { signatureToVRS, packSignatures } = require('../../utils/message')
const { readAccessListFile } = require('../../utils/utils')
const { parseAMBMessage } = require('../../../../commons')
const estimateGas = require('./estimateGas')
const { AlreadyProcessedError, IncompatibleContractError, InvalidValidatorError } = require('../../utils/errors')
const { MAX_CONCURRENT_EVENTS, EXTRA_GAS_ABSOLUTE } = require('../../utils/constants')

const limit = promiseLimit(MAX_CONCURRENT_EVENTS)

const {
  ORACLE_HOME_TO_FOREIGN_ALLOWANCE_LIST,
  ORACLE_HOME_TO_FOREIGN_BLOCK_LIST,
  ORACLE_ALWAYS_RELAY_SIGNATURES
} = process.env

let validatorContract = null

function processCollectedSignaturesBuilder(config) {
  const homeBridge = new web3Home.eth.Contract(config.homeBridgeAbi, config.homeBridgeAddress)

  const foreignBridge = new web3Foreign.eth.Contract(config.foreignBridgeAbi, config.foreignBridgeAddress)

  return async function processCollectedSignatures(signatures) {
    const txToSend = []

    if (validatorContract === null) {
      rootLogger.debug('Getting validator contract address')
      const validatorContractAddress = await foreignBridge.methods.validatorContract().call()
      rootLogger.debug({ validatorContractAddress }, 'Validator contract address obtained')

      validatorContract = new web3Foreign.eth.Contract(bridgeValidatorsABI, validatorContractAddress)
    }

    rootLogger.debug(`Processing ${signatures.length} CollectedSignatures events`)
    const callbacks = signatures
      .map(colSignature => async () => {
        const { authorityResponsibleForRelay, messageHash, NumberOfCollectedSignatures } = colSignature.returnValues

        const logger = rootLogger.child({
          eventTransactionHash: colSignature.transactionHash
        })

        if (ORACLE_ALWAYS_RELAY_SIGNATURES && ORACLE_ALWAYS_RELAY_SIGNATURES === 'true') {
          logger.debug('Validator handles all CollectedSignature requests')
        } else if (authorityResponsibleForRelay !== web3Home.utils.toChecksumAddress(config.validatorAddress)) {
          logger.info(`Validator not responsible for relaying CollectedSignatures ${colSignature.transactionHash}`)
          return
        }

        logger.info(`Processing CollectedSignatures ${colSignature.transactionHash}`)
        const message = await homeBridge.methods.message(messageHash).call()
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

        if (parsedMessage.decodedDataType.manualLane) {
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
          const signature = await homeBridge.methods.signature(messageHash, index).call()
          const vrs = signatureToVRS(signature)
          v.push(vrs.v)
          r.push(vrs.r)
          s.push(vrs.s)
          signaturesArray.push(vrs)
        })

        await Promise.all(signaturePromises)
        const signatures = packSignatures(signaturesArray)

        const { messageId } = parseAMBMessage(message)
        logger.info(`Processing messageId: ${messageId}`)

        let gasEstimate
        try {
          logger.debug('Estimate gas')
          gasEstimate = await estimateGas({
            foreignBridge,
            validatorContract,
            v,
            r,
            s,
            signatures,
            message,
            numberOfCollectedSignatures: NumberOfCollectedSignatures,
            messageId,
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
        const data = await foreignBridge.methods.executeSignatures(message, signatures).encodeABI()

        txToSend.push({
          data,
          gasEstimate,
          extraGas: EXTRA_GAS_ABSOLUTE,
          transactionReference: colSignature.transactionHash,
          to: config.foreignBridgeAddress
        })
      })
      .map(promise => limit(promise))

    await Promise.all(callbacks)

    return txToSend
  }
}

module.exports = processCollectedSignaturesBuilder
