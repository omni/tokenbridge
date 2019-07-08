import BN from 'bignumber.js'
import { getTokenType, mintedTotallyByBridge } from '../contract'
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
describe('mintedTotallyByBridge', () => {
  it('should call mintedTotallyByBridge from contract', async () => {
    // Given
    const bridgeAddress = '0xCecBE80Ed3548dE11D7d2D922a36576eA40C4c26'
    const value = '120000'
    const contract = {
      methods: {
        mintedTotallyByBridge: address => {
          return {
            call: () => Promise.resolve(address === bridgeAddress ? value : '0')
          }
        }
      }
    }

    // When
    const result = await mintedTotallyByBridge(contract, bridgeAddress)

    // Then
    expect(BN.isBigNumber(result)).toBeTruthy()
    expect(result.toString()).toEqual(value)
  })
})
