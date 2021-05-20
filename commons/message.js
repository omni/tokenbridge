const { soliditySha3 } = require('web3-utils')

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

const ambInformationSignatures = [
  'eth_call(address,bytes)',
  'eth_call(address,bytes,uint256)',
  'eth_call(address,address,uint256,bytes)',
  'eth_blockNumber()',
  'eth_getBlockByNumber()',
  'eth_getBlockByNumber(uint256)',
  'eth_getBlockByHash(bytes32)',
  'eth_getBalance(address)',
  'eth_getBalance(address,uint256)',
  'eth_getTransactionCount(address)',
  'eth_getTransactionCount(address,uint256)',
  'eth_getTransactionByHash(bytes32)',
  'eth_getTransactionReceipt(bytes32)',
  'eth_getStorageAt(address,bytes32)',
  'eth_getStorageAt(address,bytes32,uint256)'
]
const ambInformationSelectors = Object.fromEntries(ambInformationSignatures.map(sig => [soliditySha3(sig), sig]))
const normalizeAMBInfoRequest = e => ({
  messageId: e.returnValues.messageId,
  sender: e.returnValues.sender,
  requestSelector: ambInformationSelectors[e.returnValues.requestSelector] || 'unknown',
  data: e.returnValues.data
})

module.exports = {
  strip0x,
  parseAMBMessage,
  normalizeAMBMessageEvent,
  ambInformationSignatures,
  normalizeAMBInfoRequest
}
