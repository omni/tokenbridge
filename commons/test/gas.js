const { expect } = require('chai')
const { gasPriceWithinLimits } = require('..')

const GAS_PRICE_BOUNDARIES = {
  MIN: 1,
  MAX: 250
}

describe('gas', () => {
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
})
