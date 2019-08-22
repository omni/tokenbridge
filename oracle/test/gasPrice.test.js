const sinon = require('sinon')
const { expect } = require('chai')
const proxyquire = require('proxyquire').noPreserveCache()
const Web3Utils = require('web3-utils')
const { processGasPriceOptions } = require('../src/services/gasPrice')
const { DEFAULT_UPDATE_INTERVAL } = require('../src/utils/constants')
const { GAS_PRICE_OPTIONS, ORACLE_GAS_PRICE_SPEEDS } = require('../../commons')

describe('gasPrice', () => {
  describe('start', () => {
    const utils = { setIntervalAndRun: sinon.spy() }
    beforeEach(() => {
      utils.setIntervalAndRun.resetHistory()
    })
    it('should call setIntervalAndRun with HOME_GAS_PRICE_UPDATE_INTERVAL interval value on Home', async () => {
      // given
      process.env.HOME_GAS_PRICE_UPDATE_INTERVAL = 15000
      const gasPrice = proxyquire('../src/services/gasPrice', { '../utils/utils': utils })

      // when
      await gasPrice.start('home')

      // then
      expect(process.env.HOME_GAS_PRICE_UPDATE_INTERVAL).to.equal('15000')
      expect(process.env.HOME_GAS_PRICE_UPDATE_INTERVAL).to.not.equal(DEFAULT_UPDATE_INTERVAL.toString())
      expect(utils.setIntervalAndRun.args[0][1]).to.equal(process.env.HOME_GAS_PRICE_UPDATE_INTERVAL.toString())
    })
    it('should call setIntervalAndRun with FOREIGN_GAS_PRICE_UPDATE_INTERVAL interval value on Foreign', async () => {
      // given
      process.env.FOREIGN_GAS_PRICE_UPDATE_INTERVAL = 15000
      const gasPrice = proxyquire('../src/services/gasPrice', { '../utils/utils': utils })

      // when
      await gasPrice.start('foreign')

      // then
      expect(process.env.FOREIGN_GAS_PRICE_UPDATE_INTERVAL).to.equal('15000')
      expect(process.env.HOME_GAS_PRICE_UPDATE_INTERVAL).to.not.equal(DEFAULT_UPDATE_INTERVAL.toString())
      expect(utils.setIntervalAndRun.args[0][1]).to.equal(process.env.FOREIGN_GAS_PRICE_UPDATE_INTERVAL.toString())
    })
    it('should call setIntervalAndRun with default interval value on Home', async () => {
      // given
      delete process.env.HOME_GAS_PRICE_UPDATE_INTERVAL
      const gasPrice = proxyquire('../src/services/gasPrice', { '../utils/utils': utils })

      // when
      await gasPrice.start('home')

      // then
      expect(process.env.HOME_GAS_PRICE_UPDATE_INTERVAL).to.equal(undefined)
      expect(utils.setIntervalAndRun.args[0][1]).to.equal(DEFAULT_UPDATE_INTERVAL)
    })
    it('should call setIntervalAndRun with default interval value on Foreign', async () => {
      // given
      delete process.env.FOREIGN_GAS_PRICE_UPDATE_INTERVAL
      const gasPrice = proxyquire('../src/services/gasPrice', { '../utils/utils': utils })

      // when
      await gasPrice.start('foreign')

      // then
      expect(process.env.FOREIGN_GAS_PRICE_UPDATE_INTERVAL).to.equal(undefined)
      expect(utils.setIntervalAndRun.args[0][1]).to.equal(DEFAULT_UPDATE_INTERVAL)
    })
  })

  describe('fetching gas price', () => {
    const utils = { setIntervalAndRun: () => {} }

    it('should fall back to default if contract and oracle/supplier are not working', async () => {
      // given
      process.env.HOME_GAS_PRICE_FALLBACK = '101000000000'
      const gasPrice = proxyquire('../src/services/gasPrice', { '../utils/utils': utils })
      await gasPrice.start('home')

      // when
      await gasPrice.fetchGasPrice('standard', 1, null, null)

      // then
      expect(gasPrice.getPrice()).to.equal('101000000000')
    })

    it('should fetch gas from oracle/supplier', async () => {
      // given
      process.env.HOME_GAS_PRICE_FALLBACK = '101000000000'
      const gasPrice = proxyquire('../src/services/gasPrice', { '../utils/utils': utils })
      await gasPrice.start('home')

      const oracleFetchFn = () => ({
        json: () => ({
          standard: '103'
        })
      })

      // when
      await gasPrice.fetchGasPrice('standard', 1, null, oracleFetchFn)

      // then
      expect(gasPrice.getPrice().toString()).to.equal('103000000000')
    })

    it('should fetch gas from contract', async () => {
      // given
      process.env.HOME_GAS_PRICE_FALLBACK = '101000000000'
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
      await gasPrice.fetchGasPrice('standard', 1, bridgeContractMock, null)

      // then
      expect(gasPrice.getPrice().toString()).to.equal('102000000000')
    })

    it('should fetch the gas price from the oracle first', async () => {
      // given
      process.env.HOME_GAS_PRICE_FALLBACK = '101000000000'
      const gasPrice = proxyquire('../src/services/gasPrice', { '../utils/utils': utils })
      await gasPrice.start('home')

      const bridgeContractMock = {
        methods: {
          gasPrice: sinon.stub().returns({
            call: sinon.stub().returns(Promise.resolve('102000000000'))
          })
        }
      }

      const oracleFetchFn = () => ({
        json: () => ({
          standard: '103'
        })
      })

      // when
      await gasPrice.fetchGasPrice('standard', 1, bridgeContractMock, oracleFetchFn)

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
      await gasPrice.fetchGasPrice('standard', 1, null, null)

      // then
      expect(fakeLogger.error.calledTwice).to.equal(true) // two errors
    })
  })
  describe('processGasPriceOptions', () => {
    const oracleMockResponse = {
      fast: 17.64,
      block_time: 13.548,
      health: true,
      standard: 10.64,
      block_number: 6704240,
      instant: 51.9,
      slow: 4.4
    }
    it('should return cached gas price if no options provided', async () => {
      // given
      const options = {}
      const cachedGasPrice = '1000000000'

      // when
      const gasPrice = await processGasPriceOptions({
        options,
        cachedGasPrice,
        cachedGasPriceOracleSpeeds: oracleMockResponse
      })

      // then
      expect(gasPrice).to.equal(cachedGasPrice)
    })
    it('should return gas price provided by options', async () => {
      // given
      const options = {
        type: GAS_PRICE_OPTIONS.GAS_PRICE,
        value: '3000000000'
      }
      const cachedGasPrice = '1000000000'

      // when
      const gasPrice = await processGasPriceOptions({
        options,
        cachedGasPrice,
        cachedGasPriceOracleSpeeds: oracleMockResponse
      })

      // then
      expect(gasPrice).to.equal(options.value)
    })
    it('should return gas price provided by oracle speed option', async () => {
      // given
      const options = {
        type: GAS_PRICE_OPTIONS.SPEED,
        value: ORACLE_GAS_PRICE_SPEEDS.STANDARD
      }
      const cachedGasPrice = '1000000000'
      const oracleGasPriceGwei = oracleMockResponse[ORACLE_GAS_PRICE_SPEEDS.STANDARD]
      const oracleGasPrice = Web3Utils.toWei(oracleGasPriceGwei.toString(), 'gwei')

      // when
      const gasPrice = await processGasPriceOptions({
        options,
        cachedGasPrice,
        cachedGasPriceOracleSpeeds: oracleMockResponse
      })

      // then
      expect(gasPrice).to.equal(oracleGasPrice)
    })
    it('should return cached gas price if invalid speed option', async () => {
      // given
      const options = {
        type: GAS_PRICE_OPTIONS.SPEED,
        value: 'unknown'
      }
      const cachedGasPrice = '1000000000'

      // when
      const gasPrice = await processGasPriceOptions({
        options,
        cachedGasPrice,
        cachedGasPriceOracleSpeeds: oracleMockResponse
      })

      // then
      expect(gasPrice).to.equal(cachedGasPrice)
    })
  })
})
