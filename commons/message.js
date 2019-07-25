const web3Utils = require('web3-utils')
const { GAS_PRICE_OPTIONS, ORACLE_GAS_PRICE_SPEEDS } = require('./constants')

const gasPriceSpeedMapper = {
  '01': ORACLE_GAS_PRICE_SPEEDS.INSTANT,
  '02': ORACLE_GAS_PRICE_SPEEDS.FAST,
  '03': ORACLE_GAS_PRICE_SPEEDS.STANDARD,
  '04': ORACLE_GAS_PRICE_SPEEDS.SLOW
}

function strip0x(input) {
  return input.replace(/^0x/, '')
}

function addTxHashToData({ encodedData, transactionHash }) {
  return encodedData.slice(0, 82) + strip0x(transactionHash) + encodedData.slice(82)
}

function parseAMBMessage(message) {
  message = strip0x(message)

  const sender = `0x${message.slice(0, 40)}`
  const executor = `0x${message.slice(40, 80)}`
  const txHash = `0x${message.slice(80, 144)}`
  const gasLimit = web3Utils.toBN(message.slice(144, 208))
  const dataType = message.slice(208, 210)
  let gasPrice = null
  let gasPriceSpeed = null
  let dataStart = 210

  switch (dataType) {
    case GAS_PRICE_OPTIONS.GAS_PRICE:
      gasPrice = web3Utils.toBN(message.slice(210, 274))
      dataStart += 64
      break
    case GAS_PRICE_OPTIONS.SPEED:
      gasPriceSpeed = gasPriceSpeedMapper[message.slice(210, 212)]
      dataStart += 2
      break
    case GAS_PRICE_OPTIONS.UNDEFINED:
    default:
      break
  }

  const data = `0x${message.slice(dataStart, message.length)}`

  return {
    sender,
    executor,
    txHash,
    gasLimit,
    dataType,
    gasPrice,
    gasPriceSpeed,
    data
  }
}

module.exports = {
  addTxHashToData,
  parseAMBMessage,
  strip0x
}
