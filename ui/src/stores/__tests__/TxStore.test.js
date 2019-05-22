import TxStore from '../TxStore'
import Web3 from 'web3'

describe('TxStore', function() {
  let txStore
  beforeEach(() => {
    const rootStore = {
      web3Store: {
        injectedWeb3: new Web3()
      }
    }
    txStore = new TxStore(rootStore)
  })
  describe('isStatusSuccess', function() {
    it('should return true if status field is 0x1', () => {
      // Given
      const tx = {
        status: '0x1',
        logs: []
      }

      // When
      const result = txStore.isStatusSuccess(tx)

      // Then
      expect(result).toBeTruthy()
    })
    it('should return false if status field is 0x0', () => {
      // Given
      const tx = {
        status: '0x0',
        logs: []
      }

      // When
      const result = txStore.isStatusSuccess(tx)

      // Then
      expect(result).toBeFalsy()
    })
    it('should work if status field is boolean', () => {
      // Given
      const tx = {
        status: false,
        logs: []
      }
      const tx2 = {
        status: true,
        logs: []
      }

      // When
      const result = txStore.isStatusSuccess(tx)
      const result2 = txStore.isStatusSuccess(tx2)

      // Then
      expect(result).toBeFalsy()
      expect(result2).toBeTruthy()
    })
    it('should return true if status field not present and logs length > 0', () => {
      // Given
      const tx = {
        logs: [{}]
      }

      // When
      const result = txStore.isStatusSuccess(tx)

      // Then
      expect(result).toBeTruthy()
    })
    it('should return false if status field not present and no logs', () => {
      // Given
      const tx = {
        logs: []
      }

      // When
      const result = txStore.isStatusSuccess(tx)

      // Then
      expect(result).toBeFalsy()
    })
    it('should return false if status field not present and logs field not present', () => {
      // Given
      const tx = {}

      // When
      const result = txStore.isStatusSuccess(tx)

      // Then
      expect(result).toBeFalsy()
    })
  })
})
