import 'jest'
import { getConfirmationsForTx } from '../getConfirmationsForTx'
import * as helpers from '../validatorConfirmationHelpers'
import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { APIPendingTransaction, APITransaction } from '../explorer'
import { VALIDATOR_CONFIRMATION_STATUS } from '../../config/constants'
import { BasicConfirmationParam } from '../../hooks/useMessageConfirmations'

jest.mock('../validatorConfirmationHelpers')

const getValidatorSuccessTransaction = helpers.getValidatorSuccessTransaction as jest.Mock<any>
const getValidatorConfirmation = helpers.getValidatorConfirmation as jest.Mock<any>
const getValidatorFailedTransaction = helpers.getValidatorFailedTransaction as jest.Mock<any>
const getValidatorPendingTransaction = helpers.getValidatorPendingTransaction as jest.Mock<any>

const messageData = '0x111111111'
const web3 = {
  utils: {
    soliditySha3Raw: (data: string) => `0xaaaa${data.replace('0x', '')}`
  }
} as Web3
const validator1 = '0x45b96809336A8b714BFbdAB3E4B5e0fe5d839908'
const validator2 = '0xAe8bFfc8BBc6AAa9E21ED1E4e4957fe798BEA25f'
const validator3 = '0x285A6eB779be4db94dA65e2F3518B1c5F0f71244'
const validatorList = [validator1, validator2, validator3]
const bridgeContract = {} as Contract
const confirmationContractMethod = () => {}
const requiredSignatures = 2
const waitingBlocksResolved = true
let subscriptions: Array<number> = []
const timestamp = 1594045859
const getFailedTransactions = (): Promise<APITransaction[]> => Promise.resolve([])
const getPendingTransactions = (): Promise<APIPendingTransaction[]> => Promise.resolve([])
const getSuccessTransactions = (): Promise<APITransaction[]> => Promise.resolve([])

const unsubscribe = () => {
  subscriptions.forEach(s => {
    clearTimeout(s)
  })
}

beforeEach(() => {
  // Clear all instances and calls to constructor and all methods:
  getValidatorSuccessTransaction.mockClear()
  getValidatorConfirmation.mockClear()
  getValidatorFailedTransaction.mockClear()
  getValidatorPendingTransaction.mockClear()
  subscriptions = []
})
describe('getConfirmationsForTx', () => {
  test('should set validator confirmations status when signatures collected even if validator transactions not found yet and set remaining validator as not required', async () => {
    getValidatorConfirmation.mockImplementation(() => async (validator: string) => ({
      validator,
      status: validator !== validator3 ? VALIDATOR_CONFIRMATION_STATUS.SUCCESS : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED
    }))
    getValidatorSuccessTransaction.mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
      validator: validatorData.validator,
      status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS,
      txHash: '',
      timestamp: 0
    }))
    getValidatorFailedTransaction.mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
      validator: validatorData.validator,
      status: VALIDATOR_CONFIRMATION_STATUS.UNDEFINED,
      txHash: '',
      timestamp: 0
    }))
    getValidatorPendingTransaction.mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
      validator: validatorData.validator,
      status: VALIDATOR_CONFIRMATION_STATUS.UNDEFINED,
      txHash: '',
      timestamp: 0
    }))

    const setResult = jest.fn()
    const setSignatureCollected = jest.fn()
    const setFailedConfirmations = jest.fn()
    const setPendingConfirmations = jest.fn()

    await getConfirmationsForTx(
      messageData,
      web3,
      validatorList,
      bridgeContract,
      confirmationContractMethod,
      setResult,
      requiredSignatures,
      setSignatureCollected,
      waitingBlocksResolved,
      subscriptions,
      timestamp,
      getFailedTransactions,
      setFailedConfirmations,
      getPendingTransactions,
      setPendingConfirmations,
      getSuccessTransactions
    )

    unsubscribe()

    expect(subscriptions.length).toEqual(1)
    expect(setResult).toBeCalledTimes(2)
    expect(getValidatorConfirmation).toBeCalledTimes(1)
    expect(getValidatorSuccessTransaction).toBeCalledTimes(1)
    expect(setSignatureCollected).toBeCalledTimes(1)
    expect(setSignatureCollected.mock.calls[0][0]).toEqual(true)

    expect(getValidatorFailedTransaction).toBeCalledTimes(1)
    expect(setFailedConfirmations).toBeCalledTimes(1)
    expect(setFailedConfirmations.mock.calls[0][0]).toEqual(false)

    expect(getValidatorPendingTransaction).toBeCalledTimes(0)
    expect(setPendingConfirmations).toBeCalledTimes(1)
    expect(setPendingConfirmations.mock.calls[0][0]).toEqual(false)

    expect(setResult.mock.calls[0][0]()).toEqual(
      expect.arrayContaining([
        { validator: validator1, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS },
        { validator: validator2, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS },
        { validator: validator3, status: VALIDATOR_CONFIRMATION_STATUS.NOT_REQUIRED }
      ])
    )
    expect(setResult.mock.calls[1][0]).toEqual(
      expect.arrayContaining([
        { validator: validator1, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS },
        { validator: validator2, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS },
        { validator: validator3, status: VALIDATOR_CONFIRMATION_STATUS.NOT_REQUIRED }
      ])
    )
  })
  test('should set validator confirmations status when signatures not collected even if validator transactions not found yet', async () => {
    getValidatorConfirmation.mockImplementation(() => async (validator: string) => ({
      validator,
      status: validator === validator3 ? VALIDATOR_CONFIRMATION_STATUS.SUCCESS : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED
    }))
    getValidatorSuccessTransaction.mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
      validator: validatorData.validator,
      status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS,
      txHash: '',
      timestamp: 0
    }))
    getValidatorFailedTransaction.mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
      validator: validatorData.validator,
      status: VALIDATOR_CONFIRMATION_STATUS.UNDEFINED,
      txHash: '',
      timestamp: 0
    }))
    getValidatorPendingTransaction.mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
      validator: validatorData.validator,
      status: VALIDATOR_CONFIRMATION_STATUS.UNDEFINED,
      txHash: '',
      timestamp: 0
    }))

    const setResult = jest.fn()
    const setSignatureCollected = jest.fn()
    const setFailedConfirmations = jest.fn()
    const setPendingConfirmations = jest.fn()

    await getConfirmationsForTx(
      messageData,
      web3,
      validatorList,
      bridgeContract,
      confirmationContractMethod,
      setResult,
      requiredSignatures,
      setSignatureCollected,
      waitingBlocksResolved,
      subscriptions,
      timestamp,
      getFailedTransactions,
      setFailedConfirmations,
      getPendingTransactions,
      setPendingConfirmations,
      getSuccessTransactions
    )

    unsubscribe()

    expect(setResult).toBeCalledTimes(2)
    expect(getValidatorConfirmation).toBeCalledTimes(1)
    expect(getValidatorSuccessTransaction).toBeCalledTimes(1)
    expect(setSignatureCollected).toBeCalledTimes(1)
    expect(setSignatureCollected.mock.calls[0][0]).toEqual(false)

    expect(getValidatorFailedTransaction).toBeCalledTimes(1)
    expect(setFailedConfirmations).toBeCalledTimes(1)
    expect(setFailedConfirmations.mock.calls[0][0]).toEqual(false)

    expect(getValidatorPendingTransaction).toBeCalledTimes(1)
    expect(setPendingConfirmations).toBeCalledTimes(1)
    expect(setPendingConfirmations.mock.calls[0][0]).toEqual(false)
  })
  test('should set validator confirmations status, validator transactions and not retry', async () => {
    getValidatorConfirmation.mockImplementation(() => async (validator: string) => ({
      validator,
      status: validator !== validator3 ? VALIDATOR_CONFIRMATION_STATUS.SUCCESS : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED
    }))
    getValidatorSuccessTransaction.mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
      validator: validatorData.validator,
      status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS,
      txHash: validatorData.validator !== validator3 ? '0x123' : '',
      timestamp: validatorData.validator !== validator3 ? 123 : 0
    }))
    getValidatorFailedTransaction.mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
      validator: validatorData.validator,
      status: VALIDATOR_CONFIRMATION_STATUS.UNDEFINED,
      txHash: '',
      timestamp: 0
    }))
    getValidatorPendingTransaction.mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
      validator: validatorData.validator,
      status: VALIDATOR_CONFIRMATION_STATUS.UNDEFINED,
      txHash: '',
      timestamp: 0
    }))

    const setResult = jest.fn()
    const setSignatureCollected = jest.fn()
    const setFailedConfirmations = jest.fn()
    const setPendingConfirmations = jest.fn()

    await getConfirmationsForTx(
      messageData,
      web3,
      validatorList,
      bridgeContract,
      confirmationContractMethod,
      setResult,
      requiredSignatures,
      setSignatureCollected,
      waitingBlocksResolved,
      subscriptions,
      timestamp,
      getFailedTransactions,
      setFailedConfirmations,
      getPendingTransactions,
      setPendingConfirmations,
      getSuccessTransactions
    )

    unsubscribe()

    expect(subscriptions.length).toEqual(0)
    expect(setResult).toBeCalledTimes(2)
    expect(getValidatorConfirmation).toBeCalledTimes(1)
    expect(getValidatorSuccessTransaction).toBeCalledTimes(1)
    expect(setSignatureCollected).toBeCalledTimes(1)
    expect(setSignatureCollected.mock.calls[0][0]).toEqual(true)

    expect(getValidatorFailedTransaction).toBeCalledTimes(1)
    expect(setFailedConfirmations).toBeCalledTimes(1)
    expect(setFailedConfirmations.mock.calls[0][0]).toEqual(false)

    expect(getValidatorPendingTransaction).toBeCalledTimes(0)
    expect(setPendingConfirmations).toBeCalledTimes(1)
    expect(setPendingConfirmations.mock.calls[0][0]).toEqual(false)

    expect(setResult.mock.calls[0][0]()).toEqual(
      expect.arrayContaining([
        { validator: validator1, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS },
        { validator: validator2, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS },
        { validator: validator3, status: VALIDATOR_CONFIRMATION_STATUS.NOT_REQUIRED }
      ])
    )
    expect(setResult.mock.calls[1][0]).toEqual(
      expect.arrayContaining([
        { validator: validator1, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS, txHash: '0x123', timestamp: 123 },
        { validator: validator2, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS, txHash: '0x123', timestamp: 123 },
        { validator: validator3, status: VALIDATOR_CONFIRMATION_STATUS.NOT_REQUIRED }
      ])
    )
  })
  test('should set validator confirmations status, validator transactions, keep failed found transaction and not retry', async () => {
    const validator4 = '0x9d2dC11C342F4eF3C5491A048D0f0eBCd2D8f7C3'
    const validatorList = [validator1, validator2, validator3, validator4]
    getValidatorConfirmation.mockImplementation(() => async (validator: string) => ({
      validator,
      status:
        validator !== validator3 && validator !== validator4
          ? VALIDATOR_CONFIRMATION_STATUS.SUCCESS
          : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED
    }))
    getValidatorSuccessTransaction.mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
      validator: validatorData.validator,
      status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS,
      txHash: validatorData.validator !== validator3 && validatorData.validator !== validator4 ? '0x123' : '',
      timestamp: validatorData.validator !== validator3 && validatorData.validator !== validator4 ? 123 : 0
    }))
    getValidatorFailedTransaction.mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
      validator: validatorData.validator,
      status:
        validatorData.validator === validator3
          ? VALIDATOR_CONFIRMATION_STATUS.FAILED
          : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED,
      txHash: validatorData.validator === validator3 ? '0x123' : '',
      timestamp: validatorData.validator === validator3 ? 123 : 0
    }))
    getValidatorPendingTransaction.mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
      validator: validatorData.validator,
      status: VALIDATOR_CONFIRMATION_STATUS.UNDEFINED,
      txHash: '',
      timestamp: 0
    }))

    const setResult = jest.fn()
    const setSignatureCollected = jest.fn()
    const setFailedConfirmations = jest.fn()
    const setPendingConfirmations = jest.fn()

    await getConfirmationsForTx(
      messageData,
      web3,
      validatorList,
      bridgeContract,
      confirmationContractMethod,
      setResult,
      requiredSignatures,
      setSignatureCollected,
      waitingBlocksResolved,
      subscriptions,
      timestamp,
      getFailedTransactions,
      setFailedConfirmations,
      getPendingTransactions,
      setPendingConfirmations,
      getSuccessTransactions
    )

    unsubscribe()

    expect(subscriptions.length).toEqual(0)
    expect(setResult).toBeCalledTimes(2)
    expect(getValidatorConfirmation).toBeCalledTimes(1)
    expect(getValidatorSuccessTransaction).toBeCalledTimes(1)
    expect(setSignatureCollected).toBeCalledTimes(1)
    expect(setSignatureCollected.mock.calls[0][0]).toEqual(true)

    expect(getValidatorFailedTransaction).toBeCalledTimes(1)
    expect(setFailedConfirmations).toBeCalledTimes(1)
    expect(setFailedConfirmations.mock.calls[0][0]).toEqual(false)

    expect(getValidatorPendingTransaction).toBeCalledTimes(0)
    expect(setPendingConfirmations).toBeCalledTimes(1)
    expect(setPendingConfirmations.mock.calls[0][0]).toEqual(false)

    expect(setResult.mock.calls[0][0]()).toEqual(
      expect.arrayContaining([
        { validator: validator1, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS },
        { validator: validator2, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS },
        { validator: validator3, status: VALIDATOR_CONFIRMATION_STATUS.FAILED, txHash: '0x123', timestamp: 123 },
        { validator: validator4, status: VALIDATOR_CONFIRMATION_STATUS.NOT_REQUIRED }
      ])
    )
    expect(setResult.mock.calls[1][0]).toEqual(
      expect.arrayContaining([
        { validator: validator1, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS, txHash: '0x123', timestamp: 123 },
        { validator: validator2, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS, txHash: '0x123', timestamp: 123 },
        { validator: validator3, status: VALIDATOR_CONFIRMATION_STATUS.FAILED, txHash: '0x123', timestamp: 123 },
        { validator: validator4, status: VALIDATOR_CONFIRMATION_STATUS.NOT_REQUIRED }
      ])
    )
  })
  test('should look for failed and pending transactions for not confirmed validators', async () => {
    // Validator1 success
    // Validator2 failed
    // Validator3 Pending

    getValidatorConfirmation.mockImplementation(() => async (validator: string) => ({
      validator,
      status: validator === validator1 ? VALIDATOR_CONFIRMATION_STATUS.SUCCESS : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED
    }))
    getValidatorSuccessTransaction.mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
      validator: validatorData.validator,
      status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS,
      txHash: validatorData.validator === validator1 ? '0x123' : '',
      timestamp: validatorData.validator === validator1 ? 123 : 0
    }))
    getValidatorFailedTransaction.mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
      validator: validatorData.validator,
      status:
        validatorData.validator === validator2
          ? VALIDATOR_CONFIRMATION_STATUS.FAILED
          : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED,
      txHash: validatorData.validator === validator2 ? '0x123' : '',
      timestamp: validatorData.validator === validator2 ? 123 : 0
    }))
    getValidatorPendingTransaction.mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
      validator: validatorData.validator,
      status:
        validatorData.validator === validator3
          ? VALIDATOR_CONFIRMATION_STATUS.PENDING
          : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED,
      txHash: validatorData.validator === validator3 ? '0x123' : '',
      timestamp: validatorData.validator === validator3 ? 123 : 0
    }))

    const setResult = jest.fn()
    const setSignatureCollected = jest.fn()
    const setFailedConfirmations = jest.fn()
    const setPendingConfirmations = jest.fn()

    await getConfirmationsForTx(
      messageData,
      web3,
      validatorList,
      bridgeContract,
      confirmationContractMethod,
      setResult,
      requiredSignatures,
      setSignatureCollected,
      waitingBlocksResolved,
      subscriptions,
      timestamp,
      getFailedTransactions,
      setFailedConfirmations,
      getPendingTransactions,
      setPendingConfirmations,
      getSuccessTransactions
    )

    unsubscribe()

    expect(setResult).toBeCalledTimes(2)
    expect(getValidatorConfirmation).toBeCalledTimes(1)
    expect(getValidatorSuccessTransaction).toBeCalledTimes(1)
    expect(setSignatureCollected).toBeCalledTimes(1)
    expect(setSignatureCollected.mock.calls[0][0]).toEqual(false)

    expect(getValidatorFailedTransaction).toBeCalledTimes(1)
    expect(setFailedConfirmations).toBeCalledTimes(1)
    expect(setFailedConfirmations.mock.calls[0][0]).toEqual(false)

    expect(getValidatorPendingTransaction).toBeCalledTimes(1)
    expect(setPendingConfirmations).toBeCalledTimes(1)
    expect(setPendingConfirmations.mock.calls[0][0]).toEqual(true)

    expect(setResult.mock.calls[0][0]()).toEqual(
      expect.arrayContaining([
        { validator: validator1, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS },
        { validator: validator2, status: VALIDATOR_CONFIRMATION_STATUS.FAILED, txHash: '0x123', timestamp: 123 },
        { validator: validator3, status: VALIDATOR_CONFIRMATION_STATUS.PENDING, txHash: '0x123', timestamp: 123 }
      ])
    )
    expect(setResult.mock.calls[1][0]).toEqual(
      expect.arrayContaining([
        { validator: validator1, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS, txHash: '0x123', timestamp: 123 },
        { validator: validator2, status: VALIDATOR_CONFIRMATION_STATUS.FAILED, txHash: '0x123', timestamp: 123 },
        { validator: validator3, status: VALIDATOR_CONFIRMATION_STATUS.PENDING, txHash: '0x123', timestamp: 123 }
      ])
    )
  })
  test('should set as failed if enough signatures failed', async () => {
    // Validator1 success
    // Validator2 failed
    // Validator3 failed

    getValidatorConfirmation.mockImplementation(() => async (validator: string) => ({
      validator,
      status: validator === validator1 ? VALIDATOR_CONFIRMATION_STATUS.SUCCESS : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED
    }))
    getValidatorSuccessTransaction.mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
      validator: validatorData.validator,
      status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS,
      txHash: validatorData.validator === validator1 ? '0x123' : '',
      timestamp: validatorData.validator === validator1 ? 123 : 0
    }))
    getValidatorFailedTransaction.mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
      validator: validatorData.validator,
      status:
        validatorData.validator !== validator1
          ? VALIDATOR_CONFIRMATION_STATUS.FAILED
          : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED,
      txHash: validatorData.validator !== validator1 ? '0x123' : '',
      timestamp: validatorData.validator !== validator1 ? 123 : 0
    }))
    getValidatorPendingTransaction.mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
      validator: validatorData.validator,
      status: VALIDATOR_CONFIRMATION_STATUS.UNDEFINED,
      txHash: '',
      timestamp: 0
    }))

    const setResult = jest.fn()
    const setSignatureCollected = jest.fn()
    const setFailedConfirmations = jest.fn()
    const setPendingConfirmations = jest.fn()

    await getConfirmationsForTx(
      messageData,
      web3,
      validatorList,
      bridgeContract,
      confirmationContractMethod,
      setResult,
      requiredSignatures,
      setSignatureCollected,
      waitingBlocksResolved,
      subscriptions,
      timestamp,
      getFailedTransactions,
      setFailedConfirmations,
      getPendingTransactions,
      setPendingConfirmations,
      getSuccessTransactions
    )

    unsubscribe()

    expect(subscriptions.length).toEqual(0)
    expect(setResult).toBeCalledTimes(2)
    expect(getValidatorConfirmation).toBeCalledTimes(1)
    expect(getValidatorSuccessTransaction).toBeCalledTimes(1)
    expect(setSignatureCollected).toBeCalledTimes(1)
    expect(setSignatureCollected.mock.calls[0][0]).toEqual(false)

    expect(getValidatorFailedTransaction).toBeCalledTimes(1)
    expect(setFailedConfirmations).toBeCalledTimes(1)
    expect(setFailedConfirmations.mock.calls[0][0]).toEqual(true)

    expect(getValidatorPendingTransaction).toBeCalledTimes(1)
    expect(setPendingConfirmations).toBeCalledTimes(1)
    expect(setPendingConfirmations.mock.calls[0][0]).toEqual(false)

    expect(setResult.mock.calls[0][0]()).toEqual(
      expect.arrayContaining([
        { validator: validator1, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS },
        { validator: validator2, status: VALIDATOR_CONFIRMATION_STATUS.FAILED, txHash: '0x123', timestamp: 123 },
        { validator: validator3, status: VALIDATOR_CONFIRMATION_STATUS.FAILED, txHash: '0x123', timestamp: 123 }
      ])
    )
    expect(setResult.mock.calls[1][0]).toEqual(
      expect.arrayContaining([
        { validator: validator1, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS, txHash: '0x123', timestamp: 123 },
        { validator: validator2, status: VALIDATOR_CONFIRMATION_STATUS.FAILED, txHash: '0x123', timestamp: 123 },
        { validator: validator3, status: VALIDATOR_CONFIRMATION_STATUS.FAILED, txHash: '0x123', timestamp: 123 }
      ])
    )
  })
  test('should remove pending state after transaction mined', async () => {
    // Validator1 success
    // Validator2 failed
    // Validator3 Pending

    getValidatorConfirmation
      .mockImplementationOnce(() => async (validator: string) => ({
        validator,
        status:
          validator === validator1 ? VALIDATOR_CONFIRMATION_STATUS.SUCCESS : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED
      }))
      .mockImplementation(() => async (validator: string) => ({
        validator,
        status:
          validator !== validator2 ? VALIDATOR_CONFIRMATION_STATUS.SUCCESS : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED
      }))
    getValidatorSuccessTransaction
      .mockImplementationOnce(() => async (validatorData: BasicConfirmationParam) => ({
        validator: validatorData.validator,
        status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS,
        txHash: validatorData.validator === validator1 ? '0x123' : '',
        timestamp: validatorData.validator === validator1 ? 123 : 0
      }))
      .mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
        validator: validatorData.validator,
        status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS,
        txHash: validatorData.validator !== validator2 ? '0x123' : '',
        timestamp: validatorData.validator !== validator2 ? 123 : 0
      }))
    getValidatorFailedTransaction.mockImplementation(() => async (validatorData: BasicConfirmationParam) => ({
      validator: validatorData.validator,
      status:
        validatorData.validator === validator2
          ? VALIDATOR_CONFIRMATION_STATUS.FAILED
          : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED,
      txHash: validatorData.validator === validator2 ? '0x123' : '',
      timestamp: validatorData.validator === validator2 ? 123 : 0
    }))
    getValidatorPendingTransaction
      .mockImplementationOnce(() => async (validatorData: BasicConfirmationParam) => ({
        validator: validatorData.validator,
        status:
          validatorData.validator === validator3
            ? VALIDATOR_CONFIRMATION_STATUS.PENDING
            : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED,
        txHash: validatorData.validator === validator3 ? '0x123' : '',
        timestamp: validatorData.validator === validator3 ? 123 : 0
      }))
      .mockImplementationOnce(() => async (validatorData: BasicConfirmationParam) => ({
        validator: validatorData.validator,
        status: VALIDATOR_CONFIRMATION_STATUS.UNDEFINED,
        txHash: '',
        timestamp: 0
      }))

    const setResult = jest.fn()
    const setSignatureCollected = jest.fn()
    const setFailedConfirmations = jest.fn()
    const setPendingConfirmations = jest.fn()

    await getConfirmationsForTx(
      messageData,
      web3,
      validatorList,
      bridgeContract,
      confirmationContractMethod,
      setResult,
      requiredSignatures,
      setSignatureCollected,
      waitingBlocksResolved,
      subscriptions,
      timestamp,
      getFailedTransactions,
      setFailedConfirmations,
      getPendingTransactions,
      setPendingConfirmations,
      getSuccessTransactions
    )

    unsubscribe()

    expect(setResult).toBeCalledTimes(2)
    expect(getValidatorConfirmation).toBeCalledTimes(1)
    expect(getValidatorSuccessTransaction).toBeCalledTimes(1)
    expect(setSignatureCollected).toBeCalledTimes(1)
    expect(setSignatureCollected.mock.calls[0][0]).toEqual(false)

    expect(getValidatorFailedTransaction).toBeCalledTimes(1)
    expect(setFailedConfirmations).toBeCalledTimes(1)
    expect(setFailedConfirmations.mock.calls[0][0]).toEqual(false)

    expect(getValidatorPendingTransaction).toBeCalledTimes(1)
    expect(setPendingConfirmations).toBeCalledTimes(1)
    expect(setPendingConfirmations.mock.calls[0][0]).toEqual(true)

    expect(setResult.mock.calls[0][0]()).toEqual(
      expect.arrayContaining([
        { validator: validator1, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS },
        { validator: validator2, status: VALIDATOR_CONFIRMATION_STATUS.FAILED, txHash: '0x123', timestamp: 123 },
        { validator: validator3, status: VALIDATOR_CONFIRMATION_STATUS.PENDING, txHash: '0x123', timestamp: 123 }
      ])
    )
    expect(setResult.mock.calls[1][0]).toEqual(
      expect.arrayContaining([
        { validator: validator1, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS, txHash: '0x123', timestamp: 123 },
        { validator: validator2, status: VALIDATOR_CONFIRMATION_STATUS.FAILED, txHash: '0x123', timestamp: 123 },
        { validator: validator3, status: VALIDATOR_CONFIRMATION_STATUS.PENDING, txHash: '0x123', timestamp: 123 }
      ])
    )

    await getConfirmationsForTx(
      messageData,
      web3,
      validatorList,
      bridgeContract,
      confirmationContractMethod,
      setResult,
      requiredSignatures,
      setSignatureCollected,
      waitingBlocksResolved,
      subscriptions,
      timestamp,
      getFailedTransactions,
      setFailedConfirmations,
      getPendingTransactions,
      setPendingConfirmations,
      getSuccessTransactions
    )

    unsubscribe()

    expect(setResult).toBeCalledTimes(4)
    expect(getValidatorConfirmation).toBeCalledTimes(2)
    expect(getValidatorSuccessTransaction).toBeCalledTimes(2)
    expect(setSignatureCollected).toBeCalledTimes(2)
    expect(setSignatureCollected.mock.calls[0][0]).toEqual(false)
    expect(setSignatureCollected.mock.calls[1][0]).toEqual(true)

    expect(getValidatorFailedTransaction).toBeCalledTimes(2)
    expect(setFailedConfirmations).toBeCalledTimes(2)
    expect(setFailedConfirmations.mock.calls[0][0]).toEqual(false)
    expect(setFailedConfirmations.mock.calls[1][0]).toEqual(false)

    expect(getValidatorPendingTransaction).toBeCalledTimes(1)
    expect(setPendingConfirmations).toBeCalledTimes(2)
    expect(setPendingConfirmations.mock.calls[0][0]).toEqual(true)
    expect(setPendingConfirmations.mock.calls[1][0]).toEqual(false)

    expect(setResult.mock.calls[2][0]()).toEqual(
      expect.arrayContaining([
        { validator: validator1, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS },
        { validator: validator2, status: VALIDATOR_CONFIRMATION_STATUS.FAILED, txHash: '0x123', timestamp: 123 },
        { validator: validator3, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS }
      ])
    )
    expect(setResult.mock.calls[3][0]).toEqual(
      expect.arrayContaining([
        { validator: validator1, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS, txHash: '0x123', timestamp: 123 },
        { validator: validator2, status: VALIDATOR_CONFIRMATION_STATUS.FAILED, txHash: '0x123', timestamp: 123 },
        { validator: validator3, status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS, txHash: '0x123', timestamp: 123 }
      ])
    )
  })
})
