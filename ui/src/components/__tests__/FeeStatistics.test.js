import React from 'react'
import { render, cleanup } from 'react-testing-library'
import { FeeStatistics } from '../FeeStatistics'
import 'jest-dom/extend-expect'
import BN from 'bignumber.js'

afterEach(cleanup)

describe('FeeStatistics', () => {
  it('should render deposit and withdrawal fee statistics', () => {
    // Given
    const depositFeeCollected = {
      value: BN(12.4),
      type: 'WETC',
      shouldDisplay: true
    }

    const withdrawFeeCollected = {
      value: BN(3.7),
      type: 'ETC',
      shouldDisplay: true
    }

    // When
    const { queryByTestId } = render(
      <FeeStatistics
        depositFeeCollected={depositFeeCollected}
        withdrawFeeCollected={withdrawFeeCollected}
      />
    )

    // Then
    const container = queryByTestId('fee-statistics')
    expect(container).toHaveTextContent('Fee Statistics')

    const depositElement = queryByTestId('deposit-fees-block')
    expect(depositElement).toBeTruthy()
    expect(depositElement).toHaveTextContent('Deposit Fees')
    expect(depositElement).toHaveTextContent(depositFeeCollected.value.toString())
    expect(depositElement).toHaveTextContent(depositFeeCollected.type)

    const withdrawElement = queryByTestId('withdrawal-fees-block')
    expect(withdrawElement).toBeTruthy()
    expect(withdrawElement).toHaveTextContent('Withdrawal Fees')
    expect(withdrawElement).toHaveTextContent(withdrawFeeCollected.value.toString())
    expect(withdrawElement).toHaveTextContent(withdrawFeeCollected.type)
  })
  it('should render withdrawal fee statistics only', () => {
    // Given
    const depositFeeCollected = {
      value: BN(0),
      type: '',
      shouldDisplay: false
    }

    const withdrawFeeCollected = {
      value: BN(3.7),
      type: 'ETC',
      shouldDisplay: true
    }

    // When
    const { queryByTestId } = render(
      <FeeStatistics
        depositFeeCollected={depositFeeCollected}
        withdrawFeeCollected={withdrawFeeCollected}
      />
    )

    // Then
    const container = queryByTestId('fee-statistics')
    expect(container).toHaveTextContent('Fee Statistics')

    const depositElement = queryByTestId('deposit-fees-block')
    expect(depositElement).toBeNull()

    const withdrawElement = queryByTestId('withdrawal-fees-block')
    expect(withdrawElement).toBeTruthy()
    expect(withdrawElement).toHaveTextContent('Withdrawal Fees')
    expect(withdrawElement).toHaveTextContent(withdrawFeeCollected.value.toString())
    expect(withdrawElement).toHaveTextContent(withdrawFeeCollected.type)
  })
  it('should render deposit fee statistics only', () => {
    // Given
    const depositFeeCollected = {
      value: BN(12.4),
      type: 'WETC',
      shouldDisplay: true
    }

    const withdrawFeeCollected = {
      value: BN(0),
      type: '',
      shouldDisplay: false
    }

    // When
    const { queryByTestId } = render(
      <FeeStatistics
        depositFeeCollected={depositFeeCollected}
        withdrawFeeCollected={withdrawFeeCollected}
      />
    )

    // Then
    const container = queryByTestId('fee-statistics')
    expect(container).toHaveTextContent('Fee Statistics')

    const depositElement = queryByTestId('deposit-fees-block')
    expect(depositElement).toBeTruthy()
    expect(depositElement).toHaveTextContent('Deposit Fees')
    expect(depositElement).toHaveTextContent(depositFeeCollected.value.toString())
    expect(depositElement).toHaveTextContent(depositFeeCollected.type)

    const withdrawElement = queryByTestId('withdrawal-fees-block')
    expect(withdrawElement).toBeNull()
  })
  it('should not render any statistic', () => {
    // Given
    const depositFeeCollected = {
      value: BN(0),
      type: '',
      shouldDisplay: false
    }

    const withdrawFeeCollected = {
      value: BN(0),
      type: '',
      shouldDisplay: false
    }

    // When
    const { queryByTestId } = render(
      <FeeStatistics
        depositFeeCollected={depositFeeCollected}
        withdrawFeeCollected={withdrawFeeCollected}
      />
    )

    // Then
    const container = queryByTestId('fee-statistics')
    const data = queryByTestId('fee-statistics-data')

    expect(container).not.toHaveTextContent('Fee Statistics')
    expect(data).toBeEmpty()
  })
})
