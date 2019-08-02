const { expect } = require('chai')
const Web3Utils = require('web3-utils')
const { gasPriceWithinLimits, normalizeGasPrice } = require('..')

const GAS_PRICE_BOUNDARIES = {
  MIN: 1,
  MAX: 250
}

describe('gas', () => {
  describe('normalizeGasPrice', () => {
    it('should work with oracle gas price in gwei', () => {
      // Given
      const oracleGasPrice = 30
      const factor = 1

      // When
      const result = normalizeGasPrice(oracleGasPrice, factor).toString()

      // Then
      expect(result).to.equal('30000000000')
    })
    it('should work with oracle gas price not in gwei', () => {
      // Given
      const oracleGasPrice = 300
      const factor = 0.1

      // When
      const result = normalizeGasPrice(oracleGasPrice, factor).toString()

      // Then
      expect(result).to.equal('30000000000')
    })
    it('should increase gas price value from oracle', () => {
      // Given
      const oracleGasPrice = 20
      const factor = 1.5

      // When
      const result = normalizeGasPrice(oracleGasPrice, factor).toString()

      // Then
      expect(result).to.equal('30000000000')
    })
  })

  describe('gasPriceWithinLimits', () => {
    it('should return gas price if gas price is between boundaries', () => {
      // given
      const minGasPrice = 1
      const middleGasPrice = 10
      const maxGasPrice = 250

      // when
      const minGasPriceWithinLimits = gasPriceWithinLimits(minGasPrice, GAS_PRICE_BOUNDARIES)
      const middleGasPriceWithinLimits = gasPriceWithinLimits(middleGasPrice, GAS_PRICE_BOUNDARIES)
      const maxGasPriceWithinLimits = gasPriceWithinLimits(maxGasPrice, GAS_PRICE_BOUNDARIES)

      // then
      expect(minGasPriceWithinLimits).to.equal(minGasPrice)
      expect(middleGasPriceWithinLimits).to.equal(middleGasPrice)
      expect(maxGasPriceWithinLimits).to.equal(maxGasPrice)
    })

    it('should return min limit if gas price is below min boundary', () => {
      // Given
      const initialGasPrice = 0.5

      // When
      const gasPrice = gasPriceWithinLimits(initialGasPrice, GAS_PRICE_BOUNDARIES)

      // Then
      expect(gasPrice).to.equal(GAS_PRICE_BOUNDARIES.MIN)
    })

    it('should return max limit if gas price is above max boundary', () => {
      // Given
      const initialGasPrice = 260

      // When
      const gasPrice = gasPriceWithinLimits(initialGasPrice, GAS_PRICE_BOUNDARIES)

      // Then
      expect(gasPrice).to.equal(GAS_PRICE_BOUNDARIES.MAX)
    })

    it('should return gas price if boundaries not provided', () => {
      // Given
      const initialGasPrice = 260

      // When
      const gasPrice = gasPriceWithinLimits(initialGasPrice)

      // Then
      expect(gasPrice).to.equal(initialGasPrice)
    })
  })

  describe('normalizeGasPrice', () => {
    it('should work with oracle gas price in gwei', () => {
      // Given
      const oracleGasPrice = 20
      const factor = 1

      // When
      const result = normalizeGasPrice(oracleGasPrice, factor).toString()

      // Then
      expect(result).to.equal('20000000000')
    })

    it('should work with oracle gas price not in gwei', () => {
      // Given
      const oracleGasPrice = 200
      const factor = 0.1

      // When
      const result = normalizeGasPrice(oracleGasPrice, factor).toString()

      // Then
      expect(result).to.equal('20000000000')
    })

    it('should increase gas price value from oracle', () => {
      // Given
      const oracleGasPrice = 20
      const factor = 1.5

      // When
      const result = normalizeGasPrice(oracleGasPrice, factor).toString()

      // Then
      expect(result).to.equal('30000000000')
    })

    it('should respect gas price max limit', () => {
      // Given
      const oracleGasPrice = 200
      const factor = 4
      const maxInWei = Web3Utils.toWei(GAS_PRICE_BOUNDARIES.MAX.toString(), 'gwei')

      // When
      const result = normalizeGasPrice(oracleGasPrice, factor, GAS_PRICE_BOUNDARIES).toString()

      // Then
      expect(result).to.equal(maxInWei)
    })

    it('should respect gas price min limit', () => {
      // Given
      const oracleGasPrice = 1
      const factor = 0.01
      const minInWei = Web3Utils.toWei(GAS_PRICE_BOUNDARIES.MIN.toString(), 'gwei')

      // When
      const result = normalizeGasPrice(oracleGasPrice, factor, GAS_PRICE_BOUNDARIES).toString()

      // Then
      expect(result).to.equal(minInWei)
    })
  })
})
