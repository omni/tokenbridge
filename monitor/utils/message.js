const web3Utils = require('web3').utils
const { addTxHashToData, parseAMBMessage } = require('../../commons')

function deliveredMsgNotProcessed(processedList) {
  return deliveredMsg => {
    const msg = parseAMBMessage(
      addTxHashToData({
        encodedData: deliveredMsg.returnValues.encodedData,
        transactionHash: deliveredMsg.transactionHash
      })
    )
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
        const msg = parseAMBMessage(
          addTxHashToData({
            encodedData: deliveredMsg.returnValues.encodedData,
            transactionHash: deliveredMsg.transactionHash
          })
        )
        return messageEqualsEvent(msg, processedMsg.returnValues)
      }).length === 0
    )
  }
}

function messageEqualsEvent(parsedMsg, event) {
  return (
    web3Utils.toChecksumAddress(parsedMsg.sender) === event.sender &&
    web3Utils.toChecksumAddress(parsedMsg.executor) === event.executor &&
    parsedMsg.txHash === event.transactionHash
  )
}

module.exports = {
  deliveredMsgNotProcessed,
  processedMsgNotDelivered
}
