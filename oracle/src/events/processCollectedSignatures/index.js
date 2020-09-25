require('../../../env')
const promiseLimit = require('promise-limit')
const { HttpListProviderError } = require('http-list-provider')
const { BRIDGE_VALIDATORS_ABI } = require('../../../../commons')
const rootLogger = require('../../services/logger')
const { web3Home, web3Foreign } = require('../../services/web3')
const { signatureToVRS, packSignatures, parseMessage } = require('../../utils/message')
const { readAccessListFile } = require('../../utils/utils')
const estimateGas = require('./estimateGas')
const { AlreadyProcessedError, IncompatibleContractError, InvalidValidatorError } = require('../../utils/errors')
const { MAX_CONCURRENT_EVENTS } = require('../../utils/constants')

const limit = promiseLimit(MAX_CONCURRENT_EVENTS)

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

      validatorContract = new web3Foreign.eth.Contract(BRIDGE_VALIDATORS_ABI, validatorContractAddress)
    }

    rootLogger.debug(`Processing ${signatures.length} CollectedSignatures events`)
    const callbacks = signatures
      .map(colSignature => async () => {
        const { authorityResponsibleForRelay, messageHash, NumberOfCollectedSignatures } = colSignature.returnValues

        const logger = rootLogger.child({
          eventTransactionHash: colSignature.transactionHash
        })

        if (authorityResponsibleForRelay !== web3Home.utils.toChecksumAddress(config.validatorAddress)) {
          logger.info(`Validator not responsible for relaying CollectedSignatures ${colSignature.transactionHash}`)
          return
        }

        logger.info(`Processing CollectedSignatures ${colSignature.transactionHash}`)
        const message = await homeBridge.methods.message(messageHash).call()

        if (config.accessLists) {
          const parsedMessage = parseMessage(message)
          const recipient = parsedMessage.recipient.toLowerCase()
          const originalTxHash = parsedMessage.txHash
          const allowanceList = await readAccessListFile(config.accessLists.allowanceList)
          const blockList = await readAccessListFile(config.accessLists.blockList)

          if (blockList.length > 0) {
            if (blockList.indexOf(recipient) > -1) {
              logger.info('Validator skips a transaction. Recipient address is in the block list.', { recipient })
              return
            }
            const sender = (await web3Home.eth.getTransaction(originalTxHash)).from.toLowerCase()
            if (blockList.indexOf(sender) > -1) {
              logger.info('Validator skips a transaction. Sender address is in the block list.', { sender })
              return
            }
          } else if (allowanceList.length > 0) {
            if (allowanceList.indexOf(recipient) === -1) {
              const sender = (await web3Home.eth.getTransaction(originalTxHash)).from.toLowerCase()
              if (allowanceList.indexOf(sender) === -1) {
                logger.info(
                  'Validator skips a transaction. Neither sender nor recipient addresses are in the allowance list.',
                  { sender, recipient }
                )
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
          const signature = await homeBridge.methods.signature(messageHash, index).call()
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
            foreignBridge,
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
        const data = await foreignBridge.methods.executeSignatures(message, signatures).encodeABI()
        txToSend.push({
          data,
          gasEstimate,
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
