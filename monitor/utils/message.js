const { normalizeAMBMessageEvent } = require('../../commons')
const { readAccessListFile } = require('./file')

const { MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST, MONITOR_HOME_TO_FOREIGN_BLOCK_LIST } = process.env

const keyAMB = e => [e.messageId, e.sender, e.executor].join(',').toLowerCase()

function deliveredMsgNotProcessed(processedList) {
  const keys = new Set()
  processedList.forEach(processedMsg => keys.add(keyAMB(processedMsg.returnValues)))
  return deliveredMsg => !keys.has(keyAMB(normalizeAMBMessageEvent(deliveredMsg)))
}

function processedMsgNotDelivered(deliveredList) {
  const keys = new Set()
  deliveredList.forEach(deliveredMsg => keys.add(keyAMB(normalizeAMBMessageEvent(deliveredMsg))))
  return processedMsg => !keys.has(keyAMB(processedMsg.returnValues))
}

function addExecutionStatus(processedList) {
  const statuses = {}
  processedList.forEach(processedMsg => {
    statuses[keyAMB(processedMsg.returnValues)] = processedMsg.returnValues.status
  })
  return deliveredMsg => {
    deliveredMsg.status = statuses[keyAMB(deliveredMsg)]
    return deliveredMsg
  }
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
      const { sender, executor, decodedDataType } = normalizeAMBMessageEvent(e)
      return (!allowanceList.includes(sender) && !allowanceList.includes(executor)) || decodedDataType.manualLane
    }
  } else if (MONITOR_HOME_TO_FOREIGN_BLOCK_LIST) {
    const blockList = readAccessListFile(MONITOR_HOME_TO_FOREIGN_BLOCK_LIST)
    return e => {
      const { sender, executor, decodedDataType } = normalizeAMBMessageEvent(e)
      return blockList.includes(sender) || blockList.includes(executor) || decodedDataType.manualLane
    }
  } else {
    return e => normalizeAMBMessageEvent(e).decodedDataType.manualLane
  }
}

module.exports = {
  deliveredMsgNotProcessed,
  processedMsgNotDelivered,
  addExecutionStatus,
  normalizeEventInformation,
  eventWithoutReference,
  unclaimedHomeToForeignRequests,
  manuallyProcessedAMBHomeToForeignRequests
}
