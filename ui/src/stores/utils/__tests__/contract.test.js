import { getTokenType } from '../contract'
import { ERC_TYPES } from '../bridgeMode'

describe('getTokenType', () => {
  it('should return ERC677 if bridgeContract is equal to bridgeAddress', async () => {
    // Given
    const bridgeAddress = '0xCecBE80Ed3548dE11D7d2D922a36576eA40C4c26'
    const contract = {
      methods: {
        bridgeContract: () => {
          return {
            call: () => Promise.resolve(bridgeAddress)
          }
        }
      }
    }

    // When
    const type = await getTokenType(contract, bridgeAddress)

    // Then
    expect(type).toEqual(ERC_TYPES.ERC677)
  })
  it('should return ERC20 if bridgeContract is not equal to bridgeAddress', async () => {
    // Given
    const bridgeAddress = '0xCecBE80Ed3548dE11D7d2D922a36576eA40C4c26'
    const contract = {
      methods: {
        bridgeContract: () => {
          return {
            call: () => Promise.resolve('0xBFCb120F7B1de491262CA4D9D8Eba70438b6896E')
          }
        }
      }
    }

    // When
    const type = await getTokenType(contract, bridgeAddress)

    // Then
    expect(type).toEqual(ERC_TYPES.ERC20)
  })
  it('should return ERC20 if bridgeContract is not present', async () => {
    // Given
    const bridgeAddress = '0xCecBE80Ed3548dE11D7d2D922a36576eA40C4c26'
    const contract = {
      methods: {
        bridgeContract: () => {
          return {
            call: () => Promise.reject()
          }
        }
      }
    }

    // When
    const type = await getTokenType(contract, bridgeAddress)

    // Then
    expect(type).toEqual(ERC_TYPES.ERC20)
  })
})
