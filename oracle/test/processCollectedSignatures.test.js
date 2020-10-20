const { expect } = require('chai').use(require('chai-as-promised'))
const sinon = require('sinon')
const Web3 = require('web3')
const { HttpListProviderError } = require('../src/services/HttpListProvider')
const { createMessage, signatureToVRS } = require('../src/utils/message')
const estimateGas = require('../src/events/processCollectedSignatures/estimateGas')
const errors = require('../src/utils/errors')

const web3 = new Web3()

const address = '0x02B18eF56cE0FE39F3bEEc8becA8bF2c78579596'

describe('processCollectedSignatures', () => {
  describe('estimateGas', () => {
    it('should return the gas estimate', async () => {
      // given
      const estimateGasStub = sinon.stub()
      estimateGasStub.resolves(1000)
      const foreignBridge = {
        methods: {
          executeSignatures: () => ({ estimateGas: estimateGasStub })
        }
      }

      // when
      const gasEstimate = await estimateGas({ web3, foreignBridge })

      // then
      expect(gasEstimate).to.equal(1000)
    })

    it('should rethrow the error if it was a HttpListProviderError', async () => {
      // given
      const estimateGasStub = sinon.stub()
      estimateGasStub.rejects(new HttpListProviderError('connection error'))
      const foreignBridge = {
        methods: {
          executeSignatures: () => ({ estimateGas: estimateGasStub })
        }
      }

      // when
      const result = estimateGas({ web3, foreignBridge })

      // then
      await expect(result).to.be.rejectedWith(HttpListProviderError)
    })

    it('should throw an AlreadyProcessedError if the transaction was already procesed', async () => {
      // given
      const estimateGasStub = sinon.stub()
      estimateGasStub.rejects(new Error())
      const foreignBridge = {
        methods: {
          executeSignatures: () => ({ estimateGas: estimateGasStub }),
          relayedMessages: () => ({ call: sinon.stub().resolves(true) })
        }
      }

      // when
      const result = estimateGas({
        web3,
        foreignBridge,
        numberOfCollectedSignatures: 1,
        message: randomMessage()
      })

      // then
      await expect(result).to.be.rejectedWith(errors.AlreadyProcessedError)
    })

    it('should throw an IncompatibleContractError if the number of signatures is less than required', async () => {
      // given
      const estimateGasStub = sinon.stub()
      estimateGasStub.rejects(new Error())
      const foreignBridge = {
        methods: {
          executeSignatures: () => ({ estimateGas: estimateGasStub }),
          relayedMessages: () => ({ call: sinon.stub().resolves(false) })
        }
      }
      const validatorContract = {
        methods: {
          requiredSignatures: () => ({ call: sinon.stub().resolves(2) })
        }
      }

      // when
      const result = estimateGas({
        web3,
        foreignBridge,
        validatorContract,
        numberOfCollectedSignatures: 1,
        message: randomMessage()
      })

      // then
      await expect(result).to.be.rejectedWith(errors.IncompatibleContractError)
    })

    it('should throw an IncompatibleContractError if the signature is invalid', async () => {
      // given
      const estimateGasStub = sinon.stub()
      estimateGasStub.rejects(new Error())
      const foreignBridge = {
        methods: {
          executeSignatures: () => ({ estimateGas: estimateGasStub }),
          relayedMessages: () => ({ call: sinon.stub().resolves(false) })
        }
      }
      const validatorContract = {
        methods: {
          requiredSignatures: () => ({ call: sinon.stub().resolves(1) }),
          isValidator: () => ({ call: sinon.stub().resolves(false) })
        }
      }

      const message = randomMessage()
      const { signature } = web3.eth.accounts.sign(
        message,
        '0xf41510ea3e58c22cbabe881c9c87e60078dac25b23f93319e355c9ae0562987a'
      )
      const { v, r, s } = signatureToVRS(signature)

      // when
      const result = estimateGas({
        web3,
        foreignBridge,
        validatorContract,
        numberOfCollectedSignatures: 1,
        v: [v],
        r: [r],
        s: [s],
        message
      })

      // then
      await expect(result).to.be.rejectedWith(errors.InvalidValidatorError)
    })

    it('should throw an Error if the signature is valid', async () => {
      // given
      const estimateGasStub = sinon.stub()
      estimateGasStub.rejects(new Error())
      const foreignBridge = {
        methods: {
          executeSignatures: () => ({ estimateGas: estimateGasStub }),
          relayedMessages: () => ({ call: sinon.stub().resolves(false) })
        }
      }
      const validatorContract = {
        methods: {
          requiredSignatures: () => ({ call: sinon.stub().resolves(1) }),
          isValidator: () => ({ call: sinon.stub().resolves(true) })
        }
      }

      const message = randomMessage()
      const { signature } = web3.eth.accounts.sign(
        message,
        '0xf41510ea3e58c22cbabe881c9c87e60078dac25b23f93319e355c9ae0562987a'
      )
      const { v, r, s } = signatureToVRS(signature)

      // when
      const result = estimateGas({
        web3,
        foreignBridge,
        validatorContract,
        numberOfCollectedSignatures: 1,
        v: [v],
        r: [r],
        s: [s],
        message
      })

      // then
      await expect(result).to.be.rejectedWith(Error, 'Unknown error while processing message')
    })
  })
})

function randomMessage() {
  return createMessage({
    recipient: address,
    value: 42,
    transactionHash: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
    bridgeAddress: '0x6E4C9178ADc17A0D9b933C0135051536941F5769',
    expectedMessageLength: 104
  })
}
