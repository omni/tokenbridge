const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const sinon = require('sinon')
const Web3 = require('web3')
const { HttpListProviderError } = require('../src/services/HttpListProvider')
const estimateGas = require('../src/events/processSignatureRequests/estimateGas')
const errors = require('../src/utils/errors')

chai.use(chaiAsPromised)
const { expect } = chai

const web3 = new Web3()

describe('processSignatureRequests', () => {
  describe('estimateGas', () => {
    const address = '0x02B18eF56cE0FE39F3bEEc8becA8bF2c78579596'

    it('should return the gas estimate', async () => {
      // given
      const estimateGasStub = sinon.stub()
      estimateGasStub.withArgs(sinon.match({ from: address })).resolves(1000)
      estimateGasStub.rejects()
      const homeBridge = {
        methods: {
          submitSignature: () => ({ estimateGas: estimateGasStub })
        }
      }

      // when
      const gasEstimate = await estimateGas({ web3, homeBridge, address })

      // then
      expect(gasEstimate).to.equal(1000)
    })

    it('should rethrow the error if it was a HttpListProviderError', async () => {
      // given
      const estimateGasStub = sinon.stub()
      estimateGasStub.rejects(new HttpListProviderError('connection error'))
      const homeBridge = {
        methods: {
          submitSignature: () => ({ estimateGas: estimateGasStub })
        }
      }

      // when
      const result = estimateGas({ web3, homeBridge, address })

      // then
      await expect(result).to.be.rejectedWith(HttpListProviderError)
    })

    it('should throw an AlreadyProcessedError if the transaction was already procesed', async () => {
      // given
      const estimateGasStub = sinon.stub()
      estimateGasStub.rejects(new Error())
      const homeBridge = {
        methods: {
          submitSignature: () => ({ estimateGas: estimateGasStub }),
          numMessagesSigned: () => ({ call: sinon.stub().resolves(1) }),
          isAlreadyProcessed: () => ({ call: sinon.stub().resolves(true) })
        }
      }

      // when
      const result = estimateGas({ web3, homeBridge, address, message: 'foo' })

      // then
      await expect(result).to.be.rejectedWith(errors.AlreadyProcessedError)
    })

    it('should throw an AlreadySignedError if the transaction was not processed but signed by this validator', async () => {
      // given
      const estimateGasStub = sinon.stub()
      estimateGasStub.rejects(new Error())
      const homeBridge = {
        methods: {
          submitSignature: () => ({ estimateGas: estimateGasStub }),
          numMessagesSigned: () => ({ call: sinon.stub().resolves(1) }),
          isAlreadyProcessed: () => ({ call: sinon.stub().resolves(false) }),
          messagesSigned: () => ({ call: sinon.stub().resolves(true) })
        }
      }

      // when
      const result = estimateGas({ web3, homeBridge, address, message: 'foo' })

      // then
      await expect(result).to.be.rejectedWith(errors.AlreadySignedError)
    })

    it('should throw an InvalidValidatorError if the transaction was not processed nor signed, by the validator is invalid', async () => {
      // given
      const estimateGasStub = sinon.stub()
      estimateGasStub.rejects(new Error())
      const homeBridge = {
        methods: {
          submitSignature: () => ({ estimateGas: estimateGasStub }),
          numMessagesSigned: () => ({ call: sinon.stub().resolves(1) }),
          isAlreadyProcessed: () => ({ call: sinon.stub().resolves(false) }),
          messagesSigned: () => ({ call: sinon.stub().resolves(false) })
        }
      }
      const validatorContract = {
        methods: {
          isValidator: () => ({ call: sinon.stub().resolves(false) })
        }
      }

      // when
      const result = estimateGas({ web3, homeBridge, validatorContract, address, message: 'foo' })

      // then
      await expect(result).to.be.rejectedWith(errors.InvalidValidatorError)
    })

    it('should throw an Error if the validator is valid', async () => {
      // given
      const estimateGasStub = sinon.stub()
      estimateGasStub.rejects(new Error())
      const homeBridge = {
        methods: {
          submitSignature: () => ({ estimateGas: estimateGasStub }),
          numMessagesSigned: () => ({ call: sinon.stub().resolves(1) }),
          isAlreadyProcessed: () => ({ call: sinon.stub().resolves(false) }),
          messagesSigned: () => ({ call: sinon.stub().resolves(false) })
        }
      }
      const validatorContract = {
        methods: {
          isValidator: () => ({ call: sinon.stub().resolves(true) })
        }
      }

      // when
      const result = estimateGas({ web3, homeBridge, validatorContract, address, message: 'foo' })

      // then
      await expect(result).to.be.rejectedWith(Error, 'Unknown error while processing message')
    })
  })
})
