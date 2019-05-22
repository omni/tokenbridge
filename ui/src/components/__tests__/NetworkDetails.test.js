import React from 'react'
import { render, cleanup } from 'react-testing-library'
import { NetworkDetails } from '../NetworkDetails'
import 'jest-dom/extend-expect'

afterEach(cleanup)

const baseData = {
  address: '0xCecBE80Ed3548dE11D7d2D922a36576eA40C4c26',
  balance: '99.99',
  currency: 'TEST',
  displayTokenAddress: true,
  getExplorerAddressUrl: () => {},
  isHome: false,
  maxCurrentLimit: '20000',
  maxPerTx: '2000',
  minPerTx: '0.01',
  tokenAddress: '0xb69d9C58C258080eABF499270c778bBDE38dd6Ac',
  tokenName: 'TEST',
  totalSupply: '100',
  url: 'https://ropsten.infura.io'
}

describe('NetworkDetails', () => {
  it('should display bridge limits information ', () => {
    // Given
    const data = {
      ...baseData,
      displayBridgeLimits: true
    }

    // When
    const { queryByTestId } = render(<NetworkDetails {...data} />)

    // Then
    const container = queryByTestId('network-details')
    expect(container).toHaveTextContent('Minimum Amount Per Transaction')
    expect(container).toHaveTextContent('Maximum Amount Per Transaction')
    expect(container).toHaveTextContent('Remaining Daily')
  })
  it('should not display bridge limits information ', () => {
    // Given
    const data = {
      ...baseData,
      displayBridgeLimits: false
    }

    // When
    const { queryByTestId } = render(<NetworkDetails {...data} />)

    // Then
    const container = queryByTestId('network-details')
    expect(container).not.toHaveTextContent('Minimum Amount Per Transaction')
    expect(container).not.toHaveTextContent('Maximum Amount Per Transaction')
    expect(container).not.toHaveTextContent('Remaining Daily')
  })
})
