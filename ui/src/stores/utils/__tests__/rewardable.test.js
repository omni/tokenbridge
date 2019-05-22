import { getFeeToApply, validFee, getRewardableData } from '../rewardable'
import { FEE_MANAGER_MODE } from '../bridgeMode'
import BN from 'bignumber.js'

describe('validFee', () => {
  it('should return true if fee different from zero', () => {
    // Given
    const fee = new BN(0.01)

    // When
    const result = validFee(fee)

    // Then
    expect(result).toBeTruthy()
  })
  it('should return false if fee equals zero', () => {
    // Given
    const fee = new BN(0)

    // When
    const result = validFee(fee)

    // Then
    expect(result).toBeFalsy()
  })
})
describe('getFeeToApply', () => {
  it('should work for ERC_TO_NATIVE bridge mode from home to foreign ', () => {
    // Given
    const homeFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.BOTH_DIRECTIONS,
      homeFee: new BN(0.01),
      foreignFee: new BN(0.02)
    }

    const foreignFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.UNDEFINED,
      homeFee: new BN(0),
      foreignFee: new BN(0)
    }

    const homeToForeignDirection = true

    // When
    const result = getFeeToApply(homeFeeManager, foreignFeeManager, homeToForeignDirection)

    // Then
    expect(validFee(result)).toBeTruthy()
    expect(result).toBe(homeFeeManager.homeFee)
  })
  it('should work for ERC_TO_NATIVE bridge mode from foreign to home', () => {
    // Given
    const homeFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.BOTH_DIRECTIONS,
      homeFee: new BN(0.01),
      foreignFee: new BN(0.02)
    }

    const foreignFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.UNDEFINED,
      homeFee: new BN(0),
      foreignFee: new BN(0)
    }

    const homeToForeignDirection = false

    // When
    const result = getFeeToApply(homeFeeManager, foreignFeeManager, homeToForeignDirection)

    // Then
    expect(validFee(result)).toBeTruthy()
    expect(result).toBe(homeFeeManager.foreignFee)
  })
  it('should work for NATIVE_TO_ERC bridge mode from home to foreign', () => {
    // Given
    const homeFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.ONE_DIRECTION,
      homeFee: new BN(0),
      foreignFee: new BN(0.02)
    }

    const foreignFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.ONE_DIRECTION,
      homeFee: new BN(0.01),
      foreignFee: new BN(0)
    }

    const homeToForeignDirection = true

    // When
    const result = getFeeToApply(homeFeeManager, foreignFeeManager, homeToForeignDirection)

    // Then
    expect(validFee(result)).toBeTruthy()
    expect(result).toBe(foreignFeeManager.homeFee)
  })
  it('should work for NATIVE_TO_ERC bridge mode from foreign to home', () => {
    // Given
    const homeFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.ONE_DIRECTION,
      homeFee: new BN(0),
      foreignFee: new BN(0.02)
    }

    const foreignFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.ONE_DIRECTION,
      homeFee: new BN(0.01),
      foreignFee: new BN(0)
    }

    const homeToForeignDirection = false

    // When
    const result = getFeeToApply(homeFeeManager, foreignFeeManager, homeToForeignDirection)

    // Then
    expect(validFee(result)).toBeTruthy()
    expect(result).toBe(homeFeeManager.foreignFee)
  })
  it('should return no valid fee if no fee manager set from home to foreign', () => {
    // Given
    const homeFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.UNDEFINED,
      homeFee: new BN(0),
      foreignFee: new BN(0)
    }

    const foreignFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.UNDEFINED,
      homeFee: new BN(0),
      foreignFee: new BN(0)
    }

    const homeToForeignDirection = true

    // When
    const result = getFeeToApply(homeFeeManager, foreignFeeManager, homeToForeignDirection)

    // Then
    expect(validFee(result)).toBeFalsy()
  })
  it('should return no valid fee if no fee manager set from home to foreign', () => {
    // Given
    const homeFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.UNDEFINED,
      homeFee: new BN(0),
      foreignFee: new BN(0)
    }

    const foreignFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.UNDEFINED,
      homeFee: new BN(0),
      foreignFee: new BN(0)
    }

    const homeToForeignDirection = false

    // When
    const result = getFeeToApply(homeFeeManager, foreignFeeManager, homeToForeignDirection)

    // Then
    expect(validFee(result)).toBeFalsy()
  })
})
describe('getRewardableData', () => {
  it('should return correct data for BOTH_DIRECTIONS on home', () => {
    // Given
    const homeFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.BOTH_DIRECTIONS,
      homeFee: new BN(0.01),
      foreignFee: new BN(0.02),
      homeHistoricFee: [{ blockNumber: 10, fee: new BN(0.01) }],
      foreignHistoricFee: [{ blockNumber: 10, fee: new BN(0.02) }]
    }

    const foreignFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.UNDEFINED,
      homeFee: new BN(0),
      foreignFee: new BN(0),
      homeHistoricFee: [],
      foreignHistoricFee: []
    }

    // When
    const result = getRewardableData(homeFeeManager, foreignFeeManager)

    // Then
    expect(result.homeFee).toBe(homeFeeManager.homeFee)
    expect(result.foreignFee).toBe(homeFeeManager.foreignFee)
    expect(result.homeHistoricFee).toEqual(homeFeeManager.homeHistoricFee)
    expect(result.foreignHistoricFee).toEqual(homeFeeManager.foreignHistoricFee)
    expect(result.depositSymbol).toBe('home')
    expect(result.withdrawSymbol).toBe('home')
    expect(result.displayDeposit).toBe(true)
    expect(result.displayWithdraw).toBe(true)
  })
  it('should return correct data for ONE_DIRECTION on home and ONE_DIRECTION on foreign', () => {
    // Given
    const homeFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.ONE_DIRECTION,
      homeFee: new BN(0),
      foreignFee: new BN(0.02),
      homeHistoricFee: [],
      foreignHistoricFee: [{ blockNumber: 10, fee: new BN(0.02) }]
    }

    const foreignFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.ONE_DIRECTION,
      homeFee: new BN(0.01),
      foreignFee: new BN(0),
      homeHistoricFee: [{ blockNumber: 10, fee: new BN(0.01) }],
      foreignHistoricFee: []
    }

    // When
    const result = getRewardableData(homeFeeManager, foreignFeeManager)

    // Then
    expect(result.homeFee).toBe(foreignFeeManager.homeFee)
    expect(result.foreignFee).toBe(homeFeeManager.foreignFee)
    expect(result.homeHistoricFee).toEqual(foreignFeeManager.homeHistoricFee)
    expect(result.foreignHistoricFee).toEqual(homeFeeManager.foreignHistoricFee)
    expect(result.depositSymbol).toBe('foreign')
    expect(result.withdrawSymbol).toBe('home')
    expect(result.displayDeposit).toBe(true)
    expect(result.displayWithdraw).toBe(true)
  })
  it('should return correct data for ONE_DIRECTION on home and UNDEFINED on foreign', () => {
    // Given
    const homeFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.ONE_DIRECTION,
      homeFee: new BN(0),
      foreignFee: new BN(0.02),
      homeHistoricFee: [],
      foreignHistoricFee: [{ blockNumber: 10, fee: new BN(0.02) }]
    }

    const foreignFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.UNDEFINED,
      homeFee: new BN(0),
      foreignFee: new BN(0),
      homeHistoricFee: [],
      foreignHistoricFee: []
    }

    const zeroBN = new BN(0)
    const emptyArray = []

    // When
    const result = getRewardableData(homeFeeManager, foreignFeeManager)

    // Then
    expect(result.homeFee).toEqual(zeroBN)
    expect(result.foreignFee).toBe(homeFeeManager.foreignFee)
    expect(result.homeHistoricFee).toEqual(emptyArray)
    expect(result.foreignHistoricFee).toEqual(homeFeeManager.foreignHistoricFee)
    expect(result.depositSymbol).toBe('')
    expect(result.withdrawSymbol).toBe('home')
    expect(result.displayDeposit).toBe(false)
    expect(result.displayWithdraw).toBe(true)
  })
  it('should return correct data for UNDEFINED on home and ONE_DIRECTION on foreign', () => {
    // Given
    const homeFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.UNDEFINED,
      homeFee: new BN(0),
      foreignFee: new BN(0),
      homeHistoricFee: [],
      foreignHistoricFee: []
    }

    const foreignFeeManager = {
      feeManagerMode: FEE_MANAGER_MODE.ONE_DIRECTION,
      homeFee: new BN(0.01),
      foreignFee: new BN(0),
      homeHistoricFee: [{ blockNumber: 10, fee: new BN(0.01) }],
      foreignHistoricFee: []
    }

    const zeroBN = new BN(0)
    const emptyArray = []

    // When
    const result = getRewardableData(homeFeeManager, foreignFeeManager)

    // Then
    expect(result.homeFee).toBe(foreignFeeManager.homeFee)
    expect(result.foreignFee).toEqual(zeroBN)
    expect(result.homeHistoricFee).toEqual(foreignFeeManager.homeHistoricFee)
    expect(result.foreignHistoricFee).toEqual(emptyArray)
    expect(result.depositSymbol).toBe('foreign')
    expect(result.withdrawSymbol).toBe('')
    expect(result.displayDeposit).toBe(true)
    expect(result.displayWithdraw).toBe(false)
  })
})
