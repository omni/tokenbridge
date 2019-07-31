import { normalizeGasPrice } from '../../../../../commons'

describe('normalizeGasPrice', () => {
  it('should work with oracle gas price in gwei', () => {
    // Given
    const oracleGasPrice = 30
    const factor = 1

    // When
    const result = normalizeGasPrice(oracleGasPrice, factor).toString()

    // Then
    expect(result).toEqual('30000000000')
  })
  it('should work with oracle gas price not in gwei', () => {
    // Given
    const oracleGasPrice = 300
    const factor = 0.1

    // When
    const result = normalizeGasPrice(oracleGasPrice, factor).toString()

    // Then
    expect(result).toEqual('30000000000')
  })
  it('should increase gas price value from oracle', () => {
    // Given
    const oracleGasPrice = 20
    const factor = 1.5

    // When
    const result = normalizeGasPrice(oracleGasPrice, factor).toString()

    // Then
    expect(result).toEqual('30000000000')
  })
})
