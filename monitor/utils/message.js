const web3Utils = require('web3').utils
const { addTxHashToData, parseAMBMessage } = require('../../oracle/src/utils/message')

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
        processedMsg.returnValues.txHash =
          processedMsg.returnValues.transactionHash || processedMsg.returnValues.txHash
        return messagesEquals(msg, processedMsg.returnValues)
      }).length === 0
    )
  }
}

function processedMsgNotDelivered(deliveredList) {
  return processedMsg => {
    processedMsg.returnValues.txHash =
      processedMsg.returnValues.transactionHash || processedMsg.returnValues.txHash
    return (
      deliveredList.filter(deliveredMsg => {
        const msg = parseAMBMessage(
          addTxHashToData({
            encodedData: deliveredMsg.returnValues.encodedData,
            transactionHash: deliveredMsg.transactionHash
          })
        )
        return messagesEquals(msg, processedMsg.returnValues)
      }).length === 0
    )
  }
}

function messagesEquals(a, b) {
  return (
    web3Utils.toChecksumAddress(a.sender) === b.sender &&
    web3Utils.toChecksumAddress(a.executor) === b.executor &&
    a.txHash === b.txHash
  )
}

module.exports = {
  deliveredMsgNotProcessed,
  processedMsgNotDelivered
}
