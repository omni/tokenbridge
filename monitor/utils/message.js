const { parseAMBMessage } = require('../../commons')
const { readAccessListFile } = require('./file')

const { MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST, MONITOR_HOME_TO_FOREIGN_BLOCK_LIST } = process.env

const keyAMB = e => [e.messageId, e.sender, e.executor].join(',').toLowerCase()

const normalizeAMBMessage = e => {
  let msgData = e.returnValues.encodedData
  if (!e.returnValues.messageId) {
    // append tx hash to an old message, where message id was not used
    // for old messages, e.messageId is a corresponding transactionHash
    msgData = e.transactionHash + msgData.slice(2)
  }
  return parseAMBMessage(msgData)
}

function deliveredMsgNotProcessed(processedList) {
  const keys = new Set()
  processedList.forEach(processedMsg => keys.add(keyAMB(processedMsg.returnValues)))
  return deliveredMsg => !keys.has(keyAMB(normalizeAMBMessage(deliveredMsg)))
}

function processedMsgNotDelivered(deliveredList) {
  const keys = new Set()
  deliveredList.forEach(deliveredMsg => keys.add(keyAMB(normalizeAMBMessage(deliveredMsg))))
  return processedMsg => !keys.has(keyAMB(processedMsg.returnValues))
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

const key = e => [e.referenceTx, e.recipient, e.value].join(',').toLowerCase()

const eventWithoutReference = otherSideEvents => {
  const keys = new Set()
  otherSideEvents.forEach(e => keys.add(key(e)))
  return e => !keys.has(key(e))
}

const unclaimedHomeToForeignRequests = () => {
  if (MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST) {
    const allowanceList = readAccessListFile(MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST)
    return e => !allowanceList.includes(e.recipient.toLowerCase()) && !(e.sender && allowanceList.includes(e.sender))
  } else if (MONITOR_HOME_TO_FOREIGN_BLOCK_LIST) {
    const blockList = readAccessListFile(MONITOR_HOME_TO_FOREIGN_BLOCK_LIST)
    return e => blockList.includes(e.recipient.toLowerCase()) || (e.sender && blockList.includes(e.sender))
  } else {
    return () => false
  }
}

const manuallyProcessedAMBHomeToForeignRequests = () => {
  if (MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST) {
    const allowanceList = readAccessListFile(MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST)
    return e => {
      const { sender, executor, decodedDataType } = normalizeAMBMessage(e)
      return (!allowanceList.includes(sender) && !allowanceList.includes(executor)) || decodedDataType.manualLane
    }
  } else if (MONITOR_HOME_TO_FOREIGN_BLOCK_LIST) {
    const blockList = readAccessListFile(MONITOR_HOME_TO_FOREIGN_BLOCK_LIST)
    return e => {
      const { sender, executor, decodedDataType } = normalizeAMBMessage(e)
      return blockList.includes(sender) || blockList.includes(executor) || decodedDataType.manualLane
    }
  } else {
    return e => normalizeAMBMessage(e).decodedDataType.manualLane
  }
}

module.exports = {
  deliveredMsgNotProcessed,
  processedMsgNotDelivered,
  normalizeEventInformation,
  eventWithoutReference,
  unclaimedHomeToForeignRequests,
  manuallyProcessedAMBHomeToForeignRequests
}
