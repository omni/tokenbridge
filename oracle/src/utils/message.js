const assert = require('assert')
const Web3Utils = require('web3-utils')
const { strip0x } = require('../../../commons')

function createMessage({ recipient, value, transactionHash, bridgeAddress, expectedMessageLength }) {
  recipient = strip0x(recipient)
  assert.strictEqual(recipient.length, 20 * 2)

  value = Web3Utils.numberToHex(value)
  value = Web3Utils.padLeft(value, 32 * 2)

  value = strip0x(value)
  assert.strictEqual(value.length, 64)

  transactionHash = strip0x(transactionHash)
  assert.strictEqual(transactionHash.length, 32 * 2)

  bridgeAddress = strip0x(bridgeAddress)
  assert.strictEqual(bridgeAddress.length, 20 * 2)

  const message = `0x${recipient}${value}${transactionHash}${bridgeAddress}`
  assert.strictEqual(message.length, 2 + 2 * expectedMessageLength)
  return message
}

function parseMessage(message) {
  message = strip0x(message)

  const recipientStart = 0
  const recipientLength = 40
  const recipient = `0x${message.slice(recipientStart, recipientStart + recipientLength)}`

  const amountStart = recipientStart + recipientLength
  const amountLength = 32 * 2
  const amount = `0x${message.slice(amountStart, amountStart + amountLength)}`

  const txHashStart = amountStart + amountLength
  const txHashLength = 32 * 2
  const txHash = `0x${message.slice(txHashStart, txHashStart + txHashLength)}`

  const contractAddressStart = txHashStart + txHashLength
  const contractAddressLength = 32 * 2
  const contractAddress = `0x${message.slice(contractAddressStart, contractAddressStart + contractAddressLength)}`

  return {
    recipient,
    amount,
    txHash,
    contractAddress
  }
}

function signatureToVRS(rawSignature) {
  const signature = strip0x(rawSignature)
  assert.strictEqual(signature.length, 2 + 32 * 2 + 32 * 2)
  const v = signature.substr(64 * 2)
  const r = signature.substr(0, 32 * 2)
  const s = signature.substr(32 * 2, 32 * 2)
  return { v, r, s }
}

function packSignatures(array) {
  const length = strip0x(Web3Utils.toHex(array.length))
  const msgLength = length.length === 1 ? `0${length}` : length
  let v = ''
  let r = ''
  let s = ''
  array.forEach(e => {
    v = v.concat(e.v)
    r = r.concat(e.r)
    s = s.concat(e.s)
  })
  return `0x${msgLength}${v}${r}${s}`
}

module.exports = {
  createMessage,
  parseMessage,
  signatureToVRS,
  packSignatures
}
