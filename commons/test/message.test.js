const { BN } = require('web3-utils')
const { expect } = require('chai').use(require('bn-chai')(BN))
const { parseAMBMessage, strip0x } = require('../message')

describe('strip0x', () => {
  it('should remove 0x from input', () => {
    // Given
    const input = '0x12345'

    // When
    const result = strip0x(input)

    // Then
    expect(result).to.be.equal('12345')
  })
  it('should not modify input if 0x is not present', () => {
    // Given
    const input = '12345'

    // When
    const result = strip0x(input)

    // Then
    expect(result).to.be.equal(input)
  })
})
describe('parseAMBMessage', () => {
  it('should parse data type 00', () => {
    const msgSender = '0x003667154bb32e42bb9e1e6532f19d187fa0082e'
    const msgExecutor = '0xf4bef13f9f4f2b203faf0c3cbbaabe1afe056955'
    const msgId = '0xbdceda9d8c94838aca10c687da1411a07b1390e88239c0638cb9cc264219cc10'
    const msgGasLimit = '000000000000000000000000000000000000000000000000000000005b877705'
    const msgDataType = '00'
    const msgData = '0xb1591967aed668a4b27645ff40c444892d91bf5951b382995d4d4f6ee3a2ce03'
    const message = `0x${strip0x(msgId)}${strip0x(msgSender)}${strip0x(
      msgExecutor
    )}${msgGasLimit}${msgDataType}${strip0x(msgData)}`

    // when
    const { sender, executor, messageId } = parseAMBMessage(message)

    // then
    expect(sender).to.be.equal(msgSender)
    expect(executor).to.be.equal(msgExecutor)
    expect(messageId).to.be.equal(msgId)
  })
})
