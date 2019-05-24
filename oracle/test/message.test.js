const { BN, toBN } = require('web3').utils
const { expect } = require('chai').use(require('bn-chai')(BN))
const {
  createMessage,
  parseMessage,
  signatureToVRS,
  parseAMBMessage,
  strip0x
} = require('../src/utils/message')
const { ORACLE_GAS_PRICE_SPEEDS } = require('../src/utils/constants')

describe('message utils', () => {
  const expectedMessageLength = 104

  describe('createMessage', () => {
    it('should create a message when receiving valid values', () => {
      // given
      const recipient = '0xe3D952Ad4B96A756D65790393128FA359a7CD888'
      const value = '42'
      const transactionHash = '0x4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5a'
      const bridgeAddress = '0xfA79875FB0828c1FBD438583ED23fF5a956D80a1'

      // when
      const message = createMessage({
        recipient,
        value,
        transactionHash,
        bridgeAddress,
        expectedMessageLength
      })

      // then
      expect(message).to.equal(
        [
          '0xe3D952Ad4B96A756D65790393128FA359a7CD888',
          '000000000000000000000000000000000000000000000000000000000000002a',
          '4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5a',
          'fA79875FB0828c1FBD438583ED23fF5a956D80a1'
        ].join('')
      )
    })

    it('should work if the recipient is not prefixed with 0x', () => {
      // given
      const recipient = 'e3D952Ad4B96A756D65790393128FA359a7CD888'
      const value = '42'
      const transactionHash = '0x4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5a'
      const bridgeAddress = '0xfA79875FB0828c1FBD438583ED23fF5a956D80a1'

      // when
      const message = createMessage({
        recipient,
        value,
        transactionHash,
        bridgeAddress,
        expectedMessageLength
      })

      // then
      expect(message).to.equal(
        [
          '0xe3D952Ad4B96A756D65790393128FA359a7CD888',
          '000000000000000000000000000000000000000000000000000000000000002a',
          '4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5a',
          'fA79875FB0828c1FBD438583ED23fF5a956D80a1'
        ].join('')
      )
    })

    it('should work if the value is in hexadecimal', () => {
      // given
      const recipient = '0xe3D952Ad4B96A756D65790393128FA359a7CD888'
      const value = '0x2a'
      const transactionHash = '0x4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5a'
      const bridgeAddress = '0xfA79875FB0828c1FBD438583ED23fF5a956D80a1'

      // when
      const message = createMessage({
        recipient,
        value,
        transactionHash,
        bridgeAddress,
        expectedMessageLength
      })

      // then
      expect(message).to.equal(
        [
          '0xe3D952Ad4B96A756D65790393128FA359a7CD888',
          '000000000000000000000000000000000000000000000000000000000000002a',
          '4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5a',
          'fA79875FB0828c1FBD438583ED23fF5a956D80a1'
        ].join('')
      )
    })

    it('should work if the transaction hash is not prefixed with 0x', () => {
      // given
      const recipient = '0xe3D952Ad4B96A756D65790393128FA359a7CD888'
      const value = '42'
      const transactionHash = '4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5a'
      const bridgeAddress = '0xfA79875FB0828c1FBD438583ED23fF5a956D80a1'

      // when
      const message = createMessage({
        recipient,
        value,
        transactionHash,
        bridgeAddress,
        expectedMessageLength
      })

      // then
      expect(message).to.equal(
        [
          '0xe3D952Ad4B96A756D65790393128FA359a7CD888',
          '000000000000000000000000000000000000000000000000000000000000002a',
          '4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5a',
          'fA79875FB0828c1FBD438583ED23fF5a956D80a1'
        ].join('')
      )
    })

    it('should work if the bridge address hash is not prefixed with 0x', () => {
      // given
      const recipient = '0xe3D952Ad4B96A756D65790393128FA359a7CD888'
      const value = '42'
      const transactionHash = '0x4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5a'
      const bridgeAddress = 'fA79875FB0828c1FBD438583ED23fF5a956D80a1'

      // when
      const message = createMessage({
        recipient,
        value,
        transactionHash,
        bridgeAddress,
        expectedMessageLength
      })

      // then
      expect(message).to.equal(
        [
          '0xe3D952Ad4B96A756D65790393128FA359a7CD888',
          '000000000000000000000000000000000000000000000000000000000000002a',
          '4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5a',
          'fA79875FB0828c1FBD438583ED23fF5a956D80a1'
        ].join('')
      )
    })

    it('should fail if the recipient is too short', () => {
      // given
      const recipient = '0xe3D952Ad4B96A756D65790393128FA359a7CD88'
      const value = '42'
      const transactionHash = '0x4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5a'

      // when
      const messageThunk = () =>
        createMessage({ recipient, value, transactionHash, expectedMessageLength })

      // then
      expect(messageThunk).to.throw()
    })

    it('should fail if the recipient is too long', () => {
      // given
      const recipient = '0xe3D952Ad4B96A756D65790393128FA359a7CD8888'
      const value = '42'
      const transactionHash = '0x4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5a'

      // when
      const messageThunk = () =>
        createMessage({ recipient, value, transactionHash, expectedMessageLength })

      // then
      expect(messageThunk).to.throw()
    })

    it('should fail if the transaction hash is too short', () => {
      // given
      const recipient = '0xe3D952Ad4B96A756D65790393128FA359a7CD888'
      const value = '42'
      const transactionHash = '0x4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5'

      // when
      const messageThunk = () =>
        createMessage({ recipient, value, transactionHash, expectedMessageLength })

      // then
      expect(messageThunk).to.throw()
    })

    it('should fail if the transaction hash is too long', () => {
      // given
      const recipient = '0xe3D952Ad4B96A756D65790393128FA359a7CD888'
      const value = '42'
      const transactionHash = '0x4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5aa'

      // when
      const messageThunk = () =>
        createMessage({ recipient, value, transactionHash, expectedMessageLength })

      // then
      expect(messageThunk).to.throw()
    })

    it('should fail if the bridge address is too short', () => {
      // given
      const recipient = '0xe3D952Ad4B96A756D65790393128FA359a7CD888'
      const value = '42'
      const transactionHash = '0x4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5a'
      const bridgeAddress = '0xfA79875FB0828c1FBD438583ED23fF5a956D80a'

      // when
      const messageThunk = () =>
        createMessage({ recipient, value, transactionHash, bridgeAddress, expectedMessageLength })

      // then
      expect(messageThunk).to.throw()
    })

    it('should fail if the bridge address is too long', () => {
      // given
      const recipient = '0xe3D952Ad4B96A756D65790393128FA359a7CD888'
      const value = '42'
      const transactionHash = '0x4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5a'
      const bridgeAddress = '0xfA79875FB0828c1FBD438583ED23fF5a956D80a11'

      // when
      const messageThunk = () =>
        createMessage({ recipient, value, transactionHash, bridgeAddress, expectedMessageLength })

      // then
      expect(messageThunk).to.throw()
    })
  })
  describe('parseMessage', () => {
    it('should return the same values that were used to create the message', () => {
      // given
      const originalRecipient = '0xe3D952Ad4B96A756D65790393128FA359a7CD888'
      const originalValue = '0x2a'
      const originalTransactionHash =
        '0x4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5a'
      const originalBridgeAddress = '0xfA79875FB0828c1FBD438583ED23fF5a956D80a1'

      // when
      const message = createMessage({
        recipient: originalRecipient,
        value: originalValue,
        transactionHash: originalTransactionHash,
        bridgeAddress: originalBridgeAddress,
        expectedMessageLength
      })
      const { recipient, amount, txHash, contractAddress } = parseMessage(message)

      // then
      expect(recipient).to.equal(originalRecipient)
      expect(toBN(amount)).to.eq.BN(toBN(originalValue))
      expect(txHash).to.equal(originalTransactionHash)
      expect(contractAddress).to.equal(originalBridgeAddress)
    })
  })
  describe('signatureToVRS', () => {
    it('should return the v, r, s values', () => {
      // given
      // 'foo' signed with PK 0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
      const signature =
        '0xed157c39b80281741e7d4075655f25b11a9182f12d90878a1ba9bfed111c899620b74dc25ba2f581be753e11673413eb90f1f08285c2100d8e16c6799818c77d1b'

      // when
      const { v, r, s } = signatureToVRS(signature)

      // then
      expect(v).to.equal(27)
      expect(r).to.equal('0xed157c39b80281741e7d4075655f25b11a9182f12d90878a1ba9bfed111c8996')
      expect(s).to.equal('0x20b74dc25ba2f581be753e11673413eb90f1f08285c2100d8e16c6799818c77d')
    })

    it('should fail if signature is too short', () => {
      // given
      const signature =
        '0xed157c39b80281741e7d4075655f25b11a9182f12d90878a1ba9bfed111c899620b74dc25ba2f581be753e11673413eb90f1f08285c2100d8e16c6799818c77d1'

      // when
      const signatureThunk = () => signatureToVRS(signature)

      // then
      expect(signatureThunk).to.throw()
    })

    it('should fail if signature is too long', () => {
      // given
      const signature =
        '0xed157c39b80281741e7d4075655f25b11a9182f12d90878a1ba9bfed111c899620b74dc25ba2f581be753e11673413eb90f1f08285c2100d8e16c6799818c77d1bb'

      // when
      const signatureThunk = () => signatureToVRS(signature)

      // then
      expect(signatureThunk).to.throw()
    })
  })
  describe('parseAMBMessage', () => {
    it('should parse data type 00', () => {
      const msgSender = '0x003667154bb32e42bb9e1e6532f19d187fa0082e'
      const msgExecutor = '0xf4bef13f9f4f2b203faf0c3cbbaabe1afe056955'
      const msgTxHash = '0xbdceda9d8c94838aca10c687da1411a07b1390e88239c0638cb9cc264219cc10'
      const msgGasLimit = '000000000000000000000000000000000000000000000000000000005b877705'
      const msgDataType = '00'
      const msgData = '0xb1591967aed668a4b27645ff40c444892d91bf5951b382995d4d4f6ee3a2ce03'
      const message = `0x${strip0x(msgSender)}${strip0x(msgExecutor)}${strip0x(
        msgTxHash
      )}${msgGasLimit}${msgDataType}${strip0x(msgData)}`

      // when
      const {
        sender,
        executor,
        txHash,
        gasLimit,
        dataType,
        gasPrice,
        gasPriceSpeed,
        data
      } = parseAMBMessage(message)

      // then
      expect(sender).to.be.equal(msgSender)
      expect(executor).to.be.equal(msgExecutor)
      expect(txHash).to.be.equal(msgTxHash)
      expect(gasLimit).to.eq.BN(toBN(msgGasLimit))
      expect(dataType).to.be.equal(msgDataType)
      expect(gasPrice).to.be.equal(null)
      expect(gasPriceSpeed).to.be.equal(null)
      expect(data).to.be.equal(msgData)
    })
    it('should parse data type 01', () => {
      const msgSender = '0x003667154bb32e42bb9e1e6532f19d187fa0082e'
      const msgExecutor = '0xf4bef13f9f4f2b203faf0c3cbbaabe1afe056955'
      const msgTxHash = '0xbdceda9d8c94838aca10c687da1411a07b1390e88239c0638cb9cc264219cc10'
      const msgGasLimit = '000000000000000000000000000000000000000000000000000000005b877705'
      const msgDataType = '01'
      const msgGasPrice = '0000000000000000000000000000000000000000000000000000000165a0bc00'
      const msgData = '0xb1591967aed668a4b27645ff40c444892d91bf5951b382995d4d4f6ee3a2ce03'
      const message = `0x${strip0x(msgSender)}${strip0x(msgExecutor)}${strip0x(
        msgTxHash
      )}${msgGasLimit}${msgDataType}${msgGasPrice}${strip0x(msgData)}`

      // when
      const {
        sender,
        executor,
        txHash,
        gasLimit,
        dataType,
        gasPrice,
        gasPriceSpeed,
        data
      } = parseAMBMessage(message)

      // then
      expect(sender).to.be.equal(msgSender)
      expect(executor).to.be.equal(msgExecutor)
      expect(txHash).to.be.equal(msgTxHash)
      expect(gasLimit).to.eq.BN(toBN(msgGasLimit))
      expect(dataType).to.be.equal(msgDataType)
      expect(gasPrice).to.eq.BN(toBN(msgGasPrice))
      expect(gasPriceSpeed).to.be.equal(null)
      expect(data).to.be.equal(msgData)
    })
    it('should parse data type 02', () => {
      const msgSender = '0x003667154bb32e42bb9e1e6532f19d187fa0082e'
      const msgExecutor = '0xf4bef13f9f4f2b203faf0c3cbbaabe1afe056955'
      const msgTxHash = '0xbdceda9d8c94838aca10c687da1411a07b1390e88239c0638cb9cc264219cc10'
      const msgGasLimit = '000000000000000000000000000000000000000000000000000000005b877705'
      const msgDataType = '02'
      const msgGasPriceSpeed = '0x03'
      const msgData = '0xb1591967aed668a4b27645ff40c444892d91bf5951b382995d4d4f6ee3a2ce03'
      const message = `0x${strip0x(msgSender)}${strip0x(msgExecutor)}${strip0x(
        msgTxHash
      )}${msgGasLimit}${msgDataType}${strip0x(msgGasPriceSpeed)}${strip0x(msgData)}`

      // when
      const {
        sender,
        executor,
        txHash,
        gasLimit,
        dataType,
        gasPrice,
        gasPriceSpeed,
        data
      } = parseAMBMessage(message)

      // then
      expect(sender).to.be.equal(msgSender)
      expect(executor).to.be.equal(msgExecutor)
      expect(txHash).to.be.equal(msgTxHash)
      expect(gasLimit).to.eq.BN(toBN(msgGasLimit))
      expect(dataType).to.be.equal(msgDataType)
      expect(gasPrice).to.be.equal(null)
      expect(gasPriceSpeed).to.be.equal(ORACLE_GAS_PRICE_SPEEDS.STANDARD)
      expect(data).to.be.equal(msgData)
    })
  })
})
