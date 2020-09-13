const sinon = require('sinon')
const { expect } = require('chai')
const proxyquire = require('proxyquire').noPreserveCache()
const { DEFAULT_UPDATE_INTERVAL } = require('../src/utils/constants')

describe('gasPrice', () => {
  describe('start', () => {
    const utils = { setIntervalAndRun: sinon.spy() }
    beforeEach(() => {
      utils.setIntervalAndRun.resetHistory()
    })
    it('should call setIntervalAndRun with ORACLE_HOME_GAS_PRICE_UPDATE_INTERVAL interval value on Home', async () => {
      // given
      process.env.ORACLE_HOME_GAS_PRICE_UPDATE_INTERVAL = 15000
      const gasPrice = proxyquire('../src/services/gasPrice', { '../utils/utils': utils })

      // when
      await gasPrice.start('home')

      // then
      expect(process.env.ORACLE_HOME_GAS_PRICE_UPDATE_INTERVAL).to.equal('15000')
      expect(process.env.ORACLE_HOME_GAS_PRICE_UPDATE_INTERVAL).to.not.equal(DEFAULT_UPDATE_INTERVAL.toString())
      expect(utils.setIntervalAndRun.args[0][1]).to.equal(process.env.ORACLE_HOME_GAS_PRICE_UPDATE_INTERVAL.toString())
    })
    it('should call setIntervalAndRun with ORACLE_FOREIGN_GAS_PRICE_UPDATE_INTERVAL interval value on Foreign', async () => {
      // given
      process.env.ORACLE_FOREIGN_GAS_PRICE_UPDATE_INTERVAL = 15000
      const gasPrice = proxyquire('../src/services/gasPrice', { '../utils/utils': utils })

      // when
      await gasPrice.start('foreign')

      // then
      expect(process.env.ORACLE_FOREIGN_GAS_PRICE_UPDATE_INTERVAL).to.equal('15000')
      expect(process.env.ORACLE_HOME_GAS_PRICE_UPDATE_INTERVAL).to.not.equal(DEFAULT_UPDATE_INTERVAL.toString())
      expect(utils.setIntervalAndRun.args[0][1]).to.equal(
        process.env.ORACLE_FOREIGN_GAS_PRICE_UPDATE_INTERVAL.toString()
      )
    })
    it('should call setIntervalAndRun with default interval value on Home', async () => {
      // given
      delete process.env.ORACLE_HOME_GAS_PRICE_UPDATE_INTERVAL
      const gasPrice = proxyquire('../src/services/gasPrice', { '../utils/utils': utils })

      // when
      await gasPrice.start('home')

      // then
      expect(process.env.ORACLE_HOME_GAS_PRICE_UPDATE_INTERVAL).to.equal(undefined)
      expect(utils.setIntervalAndRun.args[0][1]).to.equal(DEFAULT_UPDATE_INTERVAL)
    })
    it('should call setIntervalAndRun with default interval value on Foreign', async () => {
      // given
      delete process.env.ORACLE_FOREIGN_GAS_PRICE_UPDATE_INTERVAL
      const gasPrice = proxyquire('../src/services/gasPrice', { '../utils/utils': utils })

      // when
      await gasPrice.start('foreign')

      // then
      expect(process.env.ORACLE_FOREIGN_GAS_PRICE_UPDATE_INTERVAL).to.equal(undefined)
      expect(utils.setIntervalAndRun.args[0][1]).to.equal(DEFAULT_UPDATE_INTERVAL)
    })
  })

  describe('fetching gas price', () => {
    const utils = { setIntervalAndRun: () => {} }

    it('should fall back to default if contract and supplier are not working', async () => {
      // given
      process.env.COMMON_HOME_GAS_PRICE_FALLBACK = '101000000000'
      const gasPrice = proxyquire('../src/services/gasPrice', { '../utils/utils': utils })
      await gasPrice.start('home')

      // when
      await gasPrice.fetchGasPrice('standard', 1, null, () => null)

      // then
      expect(gasPrice.getPrice()).to.equal('101000000000')
    })

    it('should fetch gas from supplier', async () => {
      // given
      process.env.COMMON_HOME_GAS_PRICE_FALLBACK = '101000000000'
      const gasPrice = proxyquire('../src/services/gasPrice', { '../utils/utils': utils })
      await gasPrice.start('home')

      const gasPriceSupplierFetchFn = () => ({
        json: () => ({
          standard: '103'
        })
      })

      // when
      await gasPrice.fetchGasPrice('standard', 1, null, gasPriceSupplierFetchFn)

      // then
      expect(gasPrice.getPrice().toString()).to.equal('103000000000')
    })

    it('should fetch gas from contract', async () => {
      // given
      process.env.COMMON_HOME_GAS_PRICE_FALLBACK = '101000000000'
      const gasPrice = proxyquire('../src/services/gasPrice', { '../utils/utils': utils })
      await gasPrice.start('home')

      const bridgeContractMock = {
        methods: {
          gasPrice: sinon.stub().returns({
            call: sinon.stub().returns(Promise.resolve('102000000000'))
          })
        }
      }

      // when
      await gasPrice.fetchGasPrice('standard', 1, bridgeContractMock, () => {})

      // then
      expect(gasPrice.getPrice().toString()).to.equal('102000000000')
    })

    it('should fetch the gas price from the oracle first', async () => {
      // given
      process.env.COMMON_HOME_GAS_PRICE_FALLBACK = '101000000000'
      const gasPrice = proxyquire('../src/services/gasPrice', { '../utils/utils': utils })
      await gasPrice.start('home')

      const bridgeContractMock = {
        methods: {
          gasPrice: sinon.stub().returns({
            call: sinon.stub().returns(Promise.resolve('102000000000'))
          })
        }
      }

      const gasPriceSupplierFetchFn = () => ({
        json: () => ({
          standard: '103'
        })
      })

      // when
      await gasPrice.fetchGasPrice('standard', 1, bridgeContractMock, gasPriceSupplierFetchFn)

      // then
      expect(gasPrice.getPrice().toString()).to.equal('103000000000')
    })

    it('log errors using the logger', async () => {
      // given
      const fakeLogger = { error: sinon.spy() }
      const gasPrice = proxyquire('../src/services/gasPrice', {
        '../utils/utils': utils,
        '../services/logger': { child: () => fakeLogger }
      })
      await gasPrice.start('home')

      // when
      await gasPrice.fetchGasPrice('standard', 1, null, () => {})

      // then
      expect(fakeLogger.error.calledTwice).to.equal(true) // two errors
    })
  })
})
