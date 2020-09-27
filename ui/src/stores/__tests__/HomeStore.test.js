import Web3 from 'web3'
import BN from 'bignumber.js'
import HomeStore from '../HomeStore'
import { BRIDGE_MODES } from '../../../../commons'
import * as contract from '../utils/contract'
import * as web3StoreUtils from '../utils/web3'

describe('HomeStore', () => {
  const rootStore = {
    web3Store: {
      injectedWeb3: new Web3(),
      homeWeb3: new Web3()
    },
    foreignStore: {
      feeEventsFinished: true,
      feeManager: {}
    },
    bridgeModeInitialized: true,
    bridgeMode: BRIDGE_MODES.ERC_TO_NATIVE
  }
  it('should call mintedTotallyByBridge', async () => {
    // Method to spy
    contract.mintedTotallyByBridge = jest.fn(() => Promise.resolve(new BN(100)))

    // Other mocks
    contract.totalBurntCoins = jest.fn(() => Promise.resolve(new BN(0)))
    contract.getBlockRewardContract = jest.fn(() => Promise.resolve('0xCecBE80Ed3548dE11D7d2D922a36576eA40C4c26'))
    contract.getPastEvents = jest.fn(() => Promise.resolve([]))
    web3StoreUtils.getBlockNumber = jest.fn(() => Promise.resolve(10))
    contract.getMinPerTxLimit = jest.fn(() => Promise.resolve(100000000))
    contract.getMaxPerTxLimit = jest.fn(() => Promise.resolve(10000000000))
    contract.getDailyLimit = jest.fn(() => Promise.resolve(10000000000))
    contract.getCurrentSpentAmount = jest.fn(() => Promise.resolve({}))
    contract.getValidatorContract = jest.fn(() => Promise.resolve('0xcDF12C376F43A70a07d7Ad2fD3449634717C9235'))
    contract.getRequiredSignatures = jest.fn(() => Promise.resolve(1))
    contract.getValidatorCount = jest.fn(() => Promise.resolve(1))
    contract.getValidatorList = jest.fn(() => Promise.resolve(['0x52576e0cCaA0C9157142Fbf1d1c6DbfAc5e4E33e']))
    contract.getRequiredBlockConfirmations = jest.fn(() => Promise.resolve(1))

    // When
    new HomeStore(rootStore)

    // Need to wait until HomeStore is initialized
    await new Promise(resolve => {
      setTimeout(() => {
        expect(contract.mintedTotallyByBridge).toHaveBeenCalled()
        resolve()
      }, 1000)
    })
  })
})
