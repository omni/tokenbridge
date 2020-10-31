function strip0x(input) {
  return input.replace(/^0x/, '')
}

function addTxHashToData({ encodedData, transactionHash }) {
  return encodedData.slice(0, 2) + strip0x(transactionHash) + encodedData.slice(2)
}

/**
 * Decodes the datatype byte from the AMB message.
 * First (the most significant bit) denotes if the message should be forwarded to the manual lane.
 * @param dataType: number datatype of the received AMB message.
 * @return {{manualLane: boolean}}
 */
const decodeAMBDataType = dataType => ({
  manualLane: (dataType & 128) === 128
})

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
    dataType,
    decodedDataType: decodeAMBDataType(dataType)
  }
}

module.exports = {
  addTxHashToData,
  parseAMBMessage,
  strip0x
}
