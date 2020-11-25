import 'jest'
import { Contract, EventData } from 'web3-eth-contract'
import Web3 from 'web3'
import { getFinalizationEvent } from '../getFinalizationEvent'
import { VALIDATOR_CONFIRMATION_STATUS } from '../../config/constants'

const eventName = 'RelayedMessage'
const timestamp = 1594045859
const validator1 = '0x45b96809336A8b714BFbdAB3E4B5e0fe5d839908'
const txHash = '0xdab36c9210e7e45fb82af10ffe4960461e41661dce0c9cd36b2843adaa1df156'

const web3 = ({
  eth: {
    getTransactionReceipt: () => ({
      from: validator1
    }),
    getBlock: () => ({ timestamp })
  },
  utils: {
    toChecksumAddress: (a: string) => a
  }
} as unknown) as Web3
const waitingBlocksResolved = true
const message = {
  id: '0x123',
  data: '0x123456789'
}
const interval = 10000
let subscriptions: Array<number> = []

const event = {
  transactionHash: txHash,
  blockNumber: 5523145,
  returnValues: {
    status: true
  }
}

const bridgeAddress = '0xFe446bEF1DbF7AFE24E81e05BC8B271C1BA9a560'

const unsubscribe = () => {
  subscriptions.forEach(s => {
    clearTimeout(s)
  })
}

beforeEach(() => {
  subscriptions = []
})
describe('getFinalizationEvent', () => {
  test('should get finalization event and not try to get failed or pending transactions', async () => {
    const contract = ({
      getPastEvents: () => {
        return [event]
      }
    } as unknown) as Contract

    const collectedSignaturesEvent = null
    const setResult = jest.fn()
    const getFailedExecution = jest.fn()
    const setFailedExecution = jest.fn()
    const getPendingExecution = jest.fn()
    const setPendingExecution = jest.fn()
    const setExecutionEventsFetched = jest.fn()

    await getFinalizationEvent(
      contract,
      eventName,
      web3,
      setResult,
      waitingBlocksResolved,
      message,
      interval,
      subscriptions,
      timestamp,
      collectedSignaturesEvent,
      getFailedExecution,
      setFailedExecution,
      getPendingExecution,
      setPendingExecution,
      setExecutionEventsFetched
    )

    unsubscribe()

    expect(subscriptions.length).toEqual(0)
    expect(setResult).toBeCalledTimes(1)
    expect(setResult.mock.calls[0][0]).toEqual({
      validator: validator1,
      status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS,
      txHash,
      timestamp,
      executionResult: true
    })

    expect(getFailedExecution).toBeCalledTimes(0)
    expect(setFailedExecution).toBeCalledTimes(0)

    expect(getPendingExecution).toBeCalledTimes(0)
    expect(setPendingExecution).toBeCalledTimes(0)
  })
  test('should retry to get finalization event and not try to get failed or pending transactions if foreign to home transaction', async () => {
    const contract = ({
      getPastEvents: () => {
        return []
      }
    } as unknown) as Contract

    const collectedSignaturesEvent = null
    const setResult = jest.fn()
    const getFailedExecution = jest.fn()
    const setFailedExecution = jest.fn()
    const getPendingExecution = jest.fn()
    const setPendingExecution = jest.fn()
    const setExecutionEventsFetched = jest.fn()

    await getFinalizationEvent(
      contract,
      eventName,
      web3,
      setResult,
      waitingBlocksResolved,
      message,
      interval,
      subscriptions,
      timestamp,
      collectedSignaturesEvent,
      getFailedExecution,
      setFailedExecution,
      getPendingExecution,
      setPendingExecution,
      setExecutionEventsFetched
    )

    unsubscribe()

    expect(subscriptions.length).toEqual(1)
    expect(setResult).toBeCalledTimes(0)

    expect(getFailedExecution).toBeCalledTimes(0)
    expect(setFailedExecution).toBeCalledTimes(0)

    expect(getPendingExecution).toBeCalledTimes(0)
    expect(setPendingExecution).toBeCalledTimes(0)
  })
  test('should retry to get finalization event and try to get failed and pending transactions if home to foreign transaction', async () => {
    const contract = ({
      getPastEvents: () => {
        return []
      },
      options: {
        address: bridgeAddress
      }
    } as unknown) as Contract

    const collectedSignaturesEvent = ({
      returnValues: {
        authorityResponsibleForRelay: validator1
      }
    } as unknown) as EventData
    const setResult = jest.fn()
    const getFailedExecution = jest.fn().mockResolvedValue([])
    const setFailedExecution = jest.fn()
    const getPendingExecution = jest.fn().mockResolvedValue([])
    const setPendingExecution = jest.fn()
    const setExecutionEventsFetched = jest.fn()

    await getFinalizationEvent(
      contract,
      eventName,
      web3,
      setResult,
      waitingBlocksResolved,
      message,
      interval,
      subscriptions,
      timestamp,
      collectedSignaturesEvent,
      getFailedExecution,
      setFailedExecution,
      getPendingExecution,
      setPendingExecution,
      setExecutionEventsFetched
    )

    unsubscribe()

    expect(subscriptions.length).toEqual(1)
    expect(setResult).toBeCalledTimes(0)

    expect(getFailedExecution).toBeCalledTimes(1)
    expect(setFailedExecution).toBeCalledTimes(0)

    expect(getPendingExecution).toBeCalledTimes(1)
    expect(setPendingExecution).toBeCalledTimes(0)
  })
  test('should retry to get finalization event and not to try to get failed transaction if pending transactions found if home to foreign transaction', async () => {
    const contract = ({
      getPastEvents: () => {
        return []
      },
      options: {
        address: bridgeAddress
      }
    } as unknown) as Contract

    const collectedSignaturesEvent = ({
      returnValues: {
        authorityResponsibleForRelay: validator1
      }
    } as unknown) as EventData
    const setResult = jest.fn()
    const getFailedExecution = jest.fn().mockResolvedValue([])
    const setFailedExecution = jest.fn()
    const getPendingExecution = jest.fn().mockResolvedValue([{ hash: txHash }])
    const setPendingExecution = jest.fn()
    const setExecutionEventsFetched = jest.fn()

    await getFinalizationEvent(
      contract,
      eventName,
      web3,
      setResult,
      waitingBlocksResolved,
      message,
      interval,
      subscriptions,
      timestamp,
      collectedSignaturesEvent,
      getFailedExecution,
      setFailedExecution,
      getPendingExecution,
      setPendingExecution,
      setExecutionEventsFetched
    )

    unsubscribe()

    expect(subscriptions.length).toEqual(1)
    expect(setResult).toBeCalledTimes(1)
    expect(setResult.mock.calls[0][0]).toEqual({
      validator: validator1,
      status: VALIDATOR_CONFIRMATION_STATUS.PENDING,
      txHash,
      timestamp: expect.any(Number),
      executionResult: false
    })

    expect(getFailedExecution).toBeCalledTimes(0)
    expect(setFailedExecution).toBeCalledTimes(0)

    expect(getPendingExecution).toBeCalledTimes(1)
    expect(setPendingExecution).toBeCalledTimes(1)
  })
  test('should retry to get finalization event even if failed transaction found if home to foreign transaction', async () => {
    const contract = ({
      getPastEvents: () => {
        return []
      },
      options: {
        address: bridgeAddress
      }
    } as unknown) as Contract

    const collectedSignaturesEvent = ({
      returnValues: {
        authorityResponsibleForRelay: validator1
      }
    } as unknown) as EventData
    const setResult = jest.fn()
    const getFailedExecution = jest.fn().mockResolvedValue([{ timeStamp: timestamp, hash: txHash }])
    const setFailedExecution = jest.fn()
    const getPendingExecution = jest.fn().mockResolvedValue([])
    const setPendingExecution = jest.fn()
    const setExecutionEventsFetched = jest.fn()

    await getFinalizationEvent(
      contract,
      eventName,
      web3,
      setResult,
      waitingBlocksResolved,
      message,
      interval,
      subscriptions,
      timestamp,
      collectedSignaturesEvent,
      getFailedExecution,
      setFailedExecution,
      getPendingExecution,
      setPendingExecution,
      setExecutionEventsFetched
    )

    unsubscribe()

    expect(subscriptions.length).toEqual(1)
    expect(setResult).toBeCalledTimes(1)
    expect(setResult.mock.calls[0][0]).toEqual({
      validator: validator1,
      status: VALIDATOR_CONFIRMATION_STATUS.FAILED,
      txHash,
      timestamp: expect.any(Number),
      executionResult: false
    })

    expect(getFailedExecution).toBeCalledTimes(1)
    expect(setFailedExecution).toBeCalledTimes(1)

    expect(getPendingExecution).toBeCalledTimes(1)
    expect(setPendingExecution).toBeCalledTimes(0)
  })
})
