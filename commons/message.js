function strip0x(input) {
  return input.replace(/^0x/, '')
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

const normalizeAMBMessageEvent = e => {
  let msgData = e.returnValues.encodedData
  if (!e.returnValues.messageId) {
    // append tx hash to an old message, where message id was not used
    // for old messages, e.messageId is a corresponding transactionHash
    msgData = e.transactionHash + msgData.slice(2)
  }
  return parseAMBMessage(msgData)
}

module.exports = {
  strip0x,
  parseAMBMessage,
  normalizeAMBMessageEvent
}
