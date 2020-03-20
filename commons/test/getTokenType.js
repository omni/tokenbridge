const { expect } = require('chai')
const { getTokenType, ERC_TYPES } = require('..')

describe('getTokenType', () => {
  it('should return ERC677 if bridgeContracts is equal to [bridgeAddress]', async () => {
    // Given
    const bridgeAddress = '0xCecBE80Ed3548dE11D7d2D922a36576eA40C4c26'
    const contract = {
      methods: {
        bridgeContracts: () => {
          return {
            call: () => Promise.resolve([bridgeAddress])
          }
        }
      }
    }

    // When
    const type = await getTokenType(contract, bridgeAddress)

    // Then
    expect(type).to.equal(ERC_TYPES.ERC677)
  })

  it('should return ERC20 if bridgeContracts is not equal to [bridgeAddress]', async () => {
    // Given
    const bridgeAddress = '0xCecBE80Ed3548dE11D7d2D922a36576eA40C4c26'
    const contract = {
      methods: {
        bridgeContracts: () => {
          return {
            call: () => Promise.resolve(['0xBFCb120F7B1de491262CA4D9D8Eba70438b6896E'])
          }
        }
      }
    }

    // When
    const type = await getTokenType(contract, bridgeAddress)

    // Then
    expect(type).to.equal(ERC_TYPES.ERC20)
  })

  it('should return ERC20 if bridgeContracts is not present', async () => {
    // Given
    const bridgeAddress = '0xCecBE80Ed3548dE11D7d2D922a36576eA40C4c26'
    const contract = {
      methods: {
        bridgeContracts: () => {
          return {
            call: () => Promise.reject()
          }
        }
      }
    }

    // When
    const type = await getTokenType(contract, bridgeAddress)

    // Then
    expect(type).to.equal(ERC_TYPES.ERC20)
  })
})
