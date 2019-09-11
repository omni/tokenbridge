function strip0x(input) {
  return input.replace(/^0x/, '')
}

function addTxHashToData({ encodedData, transactionHash }) {
  return encodedData.slice(0, 2) + strip0x(transactionHash) + encodedData.slice(2)
}

function parseAMBMessage(message) {
  message = strip0x(message)

  const txHash = `0x${message.slice(0, 64)}`
  const sender = `0x${message.slice(64, 104)}`
  const executor = `0x${message.slice(104, 144)}`

  return {
    sender,
    executor,
    txHash
  }
}

module.exports = {
  addTxHashToData,
  parseAMBMessage,
  strip0x
}
