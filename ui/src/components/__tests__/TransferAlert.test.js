import React from 'react'
import { render, cleanup } from 'react-testing-library'
import { TransferAlert } from '../TransferAlert'
import 'jest-dom/extend-expect'
import BN from 'bignumber.js'

afterEach(cleanup)

describe('TransferAlert', function() {
  it('does not render fee information if not provided', async () => {
    const data = {
      from: 'Sokol',
      to: 'Kovan',
      fromCurrency: 'sPoa',
      toCurrency: 'POA20',
      fromAmount: new BN(1),
      toAmount: new BN(1),
      fee: null,
      reverse: false
    }

    const { getByTestId } = render(<TransferAlert {...data} />)

    expect(getByTestId('transfer-description')).not.toHaveTextContent('Fee')
  })
  it('render fee information', async () => {
    const amount = new BN(1)
    const feeToApply = new BN(0.01)
    const fee = feeToApply.multipliedBy(100)
    const finalAmount = new BN(amount).multipliedBy(1 - feeToApply)

    const data = {
      from: 'Sokol',
      to: 'Kovan',
      fromCurrency: 'sPoa',
      toCurrency: 'POA20',
      fromAmount: amount,
      toAmount: finalAmount,
      fee,
      reverse: false
    }

    const { getByTestId } = render(<TransferAlert {...data} />)

    expect(getByTestId('transfer-description')).toHaveTextContent('Fee')
    expect(getByTestId('transfer-description')).toHaveTextContent(fee.toString())
  })
})
