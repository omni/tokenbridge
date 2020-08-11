const { BN, toBN } = require('web3').utils
const { expect } = require('chai').use(require('bn-chai')(BN))
const { createMessage, parseMessage, signatureToVRS, parseAMBHeader } = require('../src/utils/message')

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
      const messageThunk = () => createMessage({ recipient, value, transactionHash, expectedMessageLength })

      // then
      expect(messageThunk).to.throw()
    })

    it('should fail if the recipient is too long', () => {
      // given
      const recipient = '0xe3D952Ad4B96A756D65790393128FA359a7CD8888'
      const value = '42'
      const transactionHash = '0x4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5a'

      // when
      const messageThunk = () => createMessage({ recipient, value, transactionHash, expectedMessageLength })

      // then
      expect(messageThunk).to.throw()
    })

    it('should fail if the transaction hash is too short', () => {
      // given
      const recipient = '0xe3D952Ad4B96A756D65790393128FA359a7CD888'
      const value = '42'
      const transactionHash = '0x4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5'

      // when
      const messageThunk = () => createMessage({ recipient, value, transactionHash, expectedMessageLength })

      // then
      expect(messageThunk).to.throw()
    })

    it('should fail if the transaction hash is too long', () => {
      // given
      const recipient = '0xe3D952Ad4B96A756D65790393128FA359a7CD888'
      const value = '42'
      const transactionHash = '0x4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5aa'

      // when
      const messageThunk = () => createMessage({ recipient, value, transactionHash, expectedMessageLength })

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
      const originalTransactionHash = '0x4a298455c1ccb17de77718fc045a876e1b4e063afaad361dcdef142a8ee48d5a'
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
      expect(v).to.equal('1b')
      expect(r).to.equal('ed157c39b80281741e7d4075655f25b11a9182f12d90878a1ba9bfed111c8996')
      expect(s).to.equal('20b74dc25ba2f581be753e11673413eb90f1f08285c2100d8e16c6799818c77d')
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
  describe('parseAMBHeader', () => {
    it('should return correct values for parsed headers', () => {
      // given
      const message =
        '0x000500009a6ff99b356dd998260582be7d95a4d08b2132600000000000000061339d0e6f308a410f18888932bdf661636a0f538f34718200957aeadd6bece186e61b95618e73a6dc000f42400101002a4d2fb102cf00000000000000000000000081c770bbe8f5f41b4642ed575e630c911c94e4070000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000002e516d543162324178466b6643456a6f715861547148734370666f724a4c66765667434853516e513847575a347662000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002e516d5a7543586f693378487338486e4c325a423539316674466f4c454471516b473655746e47324d6d513147614e000000000000000000000000000000000000'

      const { messageId, sender, executor, gasLimit } = parseAMBHeader(message)

      // then
      expect(messageId).to.equal('0x000500009a6ff99b356dd998260582be7d95a4d08b2132600000000000000061')
      expect(sender).to.equal('0x339d0e6f308a410f18888932bdf661636a0f538f')
      expect(executor).to.equal('0x34718200957aeadd6bece186e61b95618e73a6dc')
      expect(gasLimit).to.equal(1000000)
    })
  })
})
