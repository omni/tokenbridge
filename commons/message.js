function strip0x(input) {
  return input.replace(/^0x/, '')
}

function addTxHashToData({ encodedData, transactionHash }) {
  return encodedData.slice(0, 2) + strip0x(transactionHash) + encodedData.slice(2)
}

function parseAMBMessage(message) {
  message = strip0x(message)

  const messageId = `0x${message.slice(0, 64)}`
  const sender = `0x${message.slice(64, 104)}`
  const executor = `0x${message.slice(104, 144)}`
  const dataType = parseInt(message.slice(156, 158), 16)

  return {
    sender,
    executor,
    messageId,
    dataType
  }
}

module.exports = {
  addTxHashToData,
  parseAMBMessage,
  strip0x
}
