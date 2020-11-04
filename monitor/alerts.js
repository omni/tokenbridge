require('dotenv').config()
const logger = require('./logger')('alerts')
const eventsInfo = require('./utils/events')
const { processedMsgNotDelivered, eventWithoutReference } = require('./utils/message')
const { BRIDGE_MODES } = require('../commons')
const { web3Home, web3Foreign, getHomeBlockNumber, getForeignBlockNumber } = require('./utils/web3')

async function main() {
  const {
    homeToForeignRequests,
    homeToForeignConfirmations,
    foreignToHomeConfirmations,
    foreignToHomeRequests,
    bridgeMode
  } = await eventsInfo()

  let xSignatures
  let xAffirmations
  if (bridgeMode === BRIDGE_MODES.ARBITRARY_MESSAGE) {
    xSignatures = homeToForeignConfirmations.filter(processedMsgNotDelivered(homeToForeignRequests))
    xAffirmations = foreignToHomeConfirmations.filter(processedMsgNotDelivered(foreignToHomeRequests))
  } else {
    xSignatures = homeToForeignConfirmations.filter(eventWithoutReference(homeToForeignRequests))
    xAffirmations = foreignToHomeConfirmations.filter(eventWithoutReference(foreignToHomeRequests))
  }
  logger.debug('building misbehavior blocks')
  const homeBlockNumber = await getHomeBlockNumber()
  const foreignBlockNumber = await getForeignBlockNumber()

  const baseRange = [false, false, false, false, false]
  const xSignaturesMisbehavior = buildRangesObject(
    xSignatures.map(findMisbehaviorRange(foreignBlockNumber)).reduce(mergeRanges, baseRange)
  )
  const xAffirmationsMisbehavior = buildRangesObject(
    xAffirmations.map(findMisbehaviorRange(homeBlockNumber)).reduce(mergeRanges, baseRange)
  )

  logger.debug('extracting most recent transactionHash')
  const { transactionHash: xSignaturesMostRecentTxHash = '' } = xSignatures.sort(sortEvents).reverse()[0] || {}
  const { transactionHash: xAffirmationsMostRecentTxHash = '' } = xAffirmations.sort(sortEvents).reverse()[0] || {}

  logger.debug('building transaction objects')
  const foreignValidators = await Promise.all(xSignatures.map(event => findTxSender(web3Foreign)(event)))
  const homeValidators = await Promise.all(xAffirmations.map(event => findTxSender(web3Home)(event)))

  const xSignaturesTxs = xSignatures.reduce(buildTxList(foreignValidators), {})
  const xAffirmationsTxs = xAffirmations.reduce(buildTxList(homeValidators), {})

  logger.debug('Done')

  return {
    executeSignatures: {
      misbehavior: xSignaturesMisbehavior,
      mostRecentTxHash: xSignaturesMostRecentTxHash,
      transactions: xSignaturesTxs
    },
    executeAffirmations: {
      misbehavior: xAffirmationsMisbehavior,
      mostRecentTxHash: xAffirmationsMostRecentTxHash,
      transactions: xAffirmationsTxs
    },
    lastChecked: Math.floor(Date.now() / 1000)
  }
}

/**
 * Finds the location for the blockNumber in a specific range starting from currentBlockNumber
 * @param {Number} currentBlockNumber
 * @returns {function({blockNumber?: *}): boolean[]}
 */
const findMisbehaviorRange = currentBlockNumber => ({ blockNumber }) => {
  const minus60 = currentBlockNumber - 60
  const minus180 = currentBlockNumber - 180
  const minus720 = currentBlockNumber - 720
  const minus17280 = currentBlockNumber - 17280

  return [
    minus60 <= blockNumber,
    minus180 <= blockNumber && minus60 > blockNumber,
    minus720 <= blockNumber && minus180 > blockNumber,
    minus17280 <= blockNumber && minus720 > blockNumber,
    minus17280 > blockNumber
  ]
}

/**
 * Merges range arrays into one single array
 * @param {Array} acc
 * @param {Array} range
 * @returns {Array}
 */
const mergeRanges = (acc, range) => acc.map((item, index) => item || range[index])

/**
 * Converts an array of boolean into the object representation of the ranges
 * @param {Array} range
 * @returns {{
 *  last60blocks: *,
 *  last60to180blocks: *,
 *  last180to720blocks: *,
 *  last720to17280blocks: *,
 *  last17280blocks: *
 * }}
 */
const buildRangesObject = range => ({
  last60blocks: range[0],
  last60to180blocks: range[1],
  last180to720blocks: range[2],
  last720to17280blocks: range[3],
  before17280blocks: range[4]
})

/**
 * Sorts events by blockNumber from oldest to newest
 * @param {Object} prev
 * @param {Object} next
 * @returns {number}
 */
const sortEvents = ({ blockNumber: prev }, { blockNumber: next }) => prev - next

/**
 * Retrieves the transaction object and returns the 'from' key from it using the provided web3 instance
 * @param {Object} web3
 * @returns {function({transactionHash?: *}): Transaction.from}
 */
const findTxSender = web3 => async ({ transactionHash }) => {
  const { from } = await web3.eth.getTransaction(transactionHash)
  return from
}

/**
 * Builds a list of transactions information using the txHash as key
 * _validatorsList_ is a correlative list of validators addresses for each event processed
 * @param {Array} validatorsList
 * @returns {{acc[event.txHash]: {
 *  value: string,
 *  block: number,
 *  referenceTx: string,
 *  recipient: string,
 *  validator: string
 * }}}
 */
const buildTxList = validatorsList => (acc, event, index) => {
  acc[event.transactionHash] = {
    value: event.value,
    block: event.blockNumber,
    referenceTx: event.referenceTx,
    recipient: event.recipient,
    validator: validatorsList[index]
  }
  return acc
}

module.exports = main
