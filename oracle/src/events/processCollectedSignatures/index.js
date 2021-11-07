require('../../../env')
const promiseLimit = require('promise-limit')
const { HttpListProviderError } = require('../../services/HttpListProvider')
const rootLogger = require('../../services/logger')
const { getValidatorContract } = require('../../tx/web3')
const { signatureToVRS, packSignatures, parseMessage } = require('../../utils/message')
const { readAccessListFile } = require('../../utils/utils')
const estimateGas = require('./estimateGas')
const { AlreadyProcessedError, IncompatibleContractError, InvalidValidatorError } = require('../../utils/errors')
const { MAX_CONCURRENT_EVENTS } = require('../../utils/constants')

const {
  ORACLE_HOME_TO_FOREIGN_ALLOWANCE_LIST,
  ORACLE_HOME_TO_FOREIGN_BLOCK_LIST,
  ORACLE_HOME_TO_FOREIGN_CHECK_SENDER,
  ORACLE_ALWAYS_RELAY_SIGNATURES
} = process.env

const limit = promiseLimit(MAX_CONCURRENT_EVENTS)

function processCollectedSignaturesBuilder(config) {
  const { home, foreign } = config

  let validatorContract = null

  return async function processCollectedSignatures(signatures) {
    const txToSend = []

    if (validatorContract === null) {
      validatorContract = await getValidatorContract(foreign.bridgeContract, foreign.web3)
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
        } else if (authorityResponsibleForRelay !== home.web3.utils.toChecksumAddress(config.validatorAddress)) {
          logger.info(`Validator not responsible for relaying CollectedSignatures ${colSignature.transactionHash}`)
          return
        }

        logger.info(`Processing CollectedSignatures ${colSignature.transactionHash}`)
        const message = await home.bridgeContract.methods.message(messageHash).call()

        if (ORACLE_HOME_TO_FOREIGN_ALLOWANCE_LIST || ORACLE_HOME_TO_FOREIGN_BLOCK_LIST) {
          const parsedMessage = parseMessage(message)
          const recipient = parsedMessage.recipient.toLowerCase()
          const originalTxHash = parsedMessage.txHash

          if (ORACLE_HOME_TO_FOREIGN_ALLOWANCE_LIST) {
            const allowanceList = await readAccessListFile(ORACLE_HOME_TO_FOREIGN_ALLOWANCE_LIST, logger)
            if (allowanceList.indexOf(recipient) === -1) {
              if (ORACLE_HOME_TO_FOREIGN_CHECK_SENDER === 'true') {
                logger.debug({ txHash: originalTxHash }, 'Requested sender of an original withdrawal transaction')
                const sender = (await home.web3.eth.getTransaction(originalTxHash)).from.toLowerCase()
                if (allowanceList.indexOf(sender) === -1) {
                  logger.info(
                    { sender, recipient },
                    'Validator skips a transaction. Neither sender nor recipient addresses are in the allowance list.'
                  )
                  return
                }
              } else {
                logger.info(
                  { recipient },
                  'Validator skips a transaction. Recipient address is not in the allowance list.'
                )
                return
              }
            }
          } else if (ORACLE_HOME_TO_FOREIGN_BLOCK_LIST) {
            const blockList = await readAccessListFile(ORACLE_HOME_TO_FOREIGN_BLOCK_LIST, logger)
            if (blockList.indexOf(recipient) > -1) {
              logger.info({ recipient }, 'Validator skips a transaction. Recipient address is in the block list.')
              return
            }
            if (ORACLE_HOME_TO_FOREIGN_CHECK_SENDER === 'true') {
              logger.debug({ txHash: originalTxHash }, 'Requested sender of an original withdrawal transaction')
              const sender = (await home.bridgeContract.eth.getTransaction(originalTxHash)).from.toLowerCase()
              if (blockList.indexOf(sender) > -1) {
                logger.info({ sender }, 'Validator skips a transaction. Sender address is in the block list.')
                return
              }
            }
          }
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
            numberOfCollectedSignatures: NumberOfCollectedSignatures
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
        const data = foreign.bridgeContract.methods.executeSignatures(message, signatures).encodeABI()
        txToSend.push({
          data,
          gasEstimate,
          transactionReference: colSignature.transactionHash,
          to: config.foreign.bridgeAddress
        })
      })
      .map(promise => limit(promise))

    await Promise.all(callbacks)

    return txToSend
  }
}

module.exports = processCollectedSignaturesBuilder
