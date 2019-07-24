import BN from 'bignumber.js'
import { mintedTotallyByBridge } from '../contract'

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
