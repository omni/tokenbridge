const sinon = require('sinon')
const { expect } = require('chai')
const proxyquire = require('proxyquire').noPreserveCache()
const { DEFAULT_UPDATE_INTERVAL } = require('../src/utils/constants')

const utils = { setIntervalAndRun: sinon.spy() }
const fetchStub = () => ({
  json: () => ({
    standard: '103'
  })
})
const fakeLogger = { error: sinon.spy(), warn: sinon.spy(), child: () => fakeLogger }
fetchStub['@global'] = true
const gasPriceDefault = proxyquire('../src/services/gasPrice', {
  '../utils/utils': utils,
  'node-fetch': fetchStub,
  '../services/logger': { child: () => fakeLogger }
})
process.env.ORACLE_HOME_GAS_PRICE_UPDATE_INTERVAL = 15000
process.env.ORACLE_FOREIGN_GAS_PRICE_UPDATE_INTERVAL = 30000
process.env.COMMON_HOME_GAS_PRICE_FALLBACK = '101000000000'
const gasPrice = proxyquire('../src/services/gasPrice', {
  '../utils/utils': utils,
  'node-fetch': fetchStub,
  '../services/logger': { child: () => fakeLogger }
})

describe('gasPrice', () => {
  beforeEach(() => {
    utils.setIntervalAndRun.resetHistory()
    fakeLogger.error.resetHistory()
    fakeLogger.warn.resetHistory()
  })

  describe('start', () => {
    it('should call setIntervalAndRun with ORACLE_HOME_GAS_PRICE_UPDATE_INTERVAL interval value on Home', async () => {
      // when
      await gasPrice.start('home')

      // then
      expect(utils.setIntervalAndRun.args[0][1]).to.equal(process.env.ORACLE_HOME_GAS_PRICE_UPDATE_INTERVAL.toString())
    })
    it('should call setIntervalAndRun with ORACLE_FOREIGN_GAS_PRICE_UPDATE_INTERVAL interval value on Foreign', async () => {
      // when
      await gasPrice.start('foreign')

      // then
      expect(utils.setIntervalAndRun.args[0][1]).to.equal(
        process.env.ORACLE_FOREIGN_GAS_PRICE_UPDATE_INTERVAL.toString()
      )
    })
    it('should call setIntervalAndRun with default interval value on Home', async () => {
      // when
      await gasPriceDefault.start('home')

      // then
      expect(utils.setIntervalAndRun.args[0][1]).to.equal(DEFAULT_UPDATE_INTERVAL)
    })
    it('should call setIntervalAndRun with default interval value on Foreign', async () => {
      // when
      await gasPriceDefault.start('foreign')

      // then
      expect(utils.setIntervalAndRun.args[0][1]).to.equal(DEFAULT_UPDATE_INTERVAL)
    })
  })

  describe('fetching gas price', () => {
    it('should fall back to default if contract and supplier are not working', async () => {
      // given
      await gasPrice.start('home')

      // when
      await gasPrice.fetchGasPrice('standard', 1, null, null)

      // then
      expect(gasPrice.getPrice()).to.equal('101000000000')
    })

    it('should fetch gas from supplier', async () => {
      // given
      await gasPrice.start('home')

      // when
      await gasPrice.fetchGasPrice('standard', 1, null, 'url')

      // then
      expect(gasPrice.getPrice().toString()).to.equal('103000000000')
    })

    it('should fetch gas from contract', async () => {
      // given
      await gasPrice.start('home')

      const bridgeContractMock = {
        methods: {
          gasPrice: sinon.stub().returns({
            call: sinon.stub().returns(Promise.resolve('102000000000'))
          })
        }
      }

      // when
      await gasPrice.fetchGasPrice('standard', 1, bridgeContractMock, null)

      // then
      expect(gasPrice.getPrice().toString()).to.equal('102000000000')
    })

    it('should fetch the gas price from the oracle first', async () => {
      // given
      await gasPrice.start('home')

      const bridgeContractMock = {
        methods: {
          gasPrice: sinon.stub().returns({
            call: sinon.stub().returns(Promise.resolve('102000000000'))
          })
        }
      }

      // when
      await gasPrice.fetchGasPrice('standard', 1, bridgeContractMock, 'url')

      // then
      expect(gasPrice.getPrice().toString()).to.equal('103000000000')
    })

    it('log error using the logger', async () => {
      // given
      await gasPrice.start('home')

      // when
      await gasPrice.fetchGasPrice('standard', 1, null, null)

      // then
      expect(fakeLogger.warn.calledOnce).to.equal(true) // one warning
      expect(fakeLogger.error.calledOnce).to.equal(true) // one error
    })
  })
})
