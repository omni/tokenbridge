const web3Utils = require('web3').utils
const { parseAMBMessage } = require('../../commons')

function deliveredMsgNotProcessed(processedList) {
  return deliveredMsg => {
    const msg = parseAMBMessage(deliveredMsg.returnValues.encodedData)
    return (
      processedList.filter(processedMsg => {
        return messageEqualsEvent(msg, processedMsg.returnValues)
      }).length === 0
    )
  }
}

function processedMsgNotDelivered(deliveredList) {
  return processedMsg => {
    return (
      deliveredList.filter(deliveredMsg => {
        const msg = parseAMBMessage(deliveredMsg.returnValues.encodedData)
        return messageEqualsEvent(msg, processedMsg.returnValues)
      }).length === 0
    )
  }
}

function messageEqualsEvent(parsedMsg, event) {
  return (
    web3Utils.toChecksumAddress(parsedMsg.sender) === event.sender &&
    web3Utils.toChecksumAddress(parsedMsg.executor) === event.executor &&
    parsedMsg.messageId === event.messageId
  )
}

/**
 * Normalizes the different event objects to facilitate data processing
 * @param {Object} event
 * @returns {{
 *  transactionHash: string,
 *  blockNumber: number,
 *  referenceTx: string,
 *  recipient: string | *,
 *  value: *
 * }}
 */
const normalizeEventInformation = event => ({
  transactionHash: event.transactionHash,
  blockNumber: event.blockNumber,
  referenceTx: event.returnValues.transactionHash || event.transactionHash,
  recipient: event.returnValues.recipient || event.returnValues.from,
  value: event.returnValues.value
})

const eventWithoutReference = otherSideEvents => e =>
  otherSideEvents.filter(a => a.referenceTx === e.referenceTx && a.recipient === e.recipient && a.value === e.value)
    .length === 0

module.exports = {
  deliveredMsgNotProcessed,
  processedMsgNotDelivered,
  normalizeEventInformation,
  eventWithoutReference
}
