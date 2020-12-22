import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { BasicConfirmationParam, ConfirmationParam } from '../hooks/useMessageConfirmations'
import validatorsCache from '../services/ValidatorsCache'
import {
  CACHE_KEY_FAILED,
  CACHE_KEY_SUCCESS,
  ONE_DAY_TIMESTAMP,
  VALIDATOR_CONFIRMATION_STATUS
} from '../config/constants'
import {
  APIPendingTransaction,
  APITransaction,
  GetFailedTransactionParams,
  GetPendingTransactionParams
} from './explorer'

export const getValidatorConfirmation = (
  web3: Web3,
  hashMsg: string,
  bridgeContract: Contract,
  confirmationContractMethod: Function
) => async (validator: string): Promise<BasicConfirmationParam> => {
  const hashSenderMsg = web3.utils.soliditySha3Raw(validator, hashMsg)

  const signatureFromCache = validatorsCache.get(hashSenderMsg)
  if (signatureFromCache) {
    return {
      validator,
      status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS
    }
  }

  const confirmed = await confirmationContractMethod(bridgeContract, hashSenderMsg)
  const status = confirmed ? VALIDATOR_CONFIRMATION_STATUS.SUCCESS : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED

  // If validator confirmed signature, we cache the result to avoid doing future requests for a result that won't change
  if (confirmed) {
    validatorsCache.set(hashSenderMsg, confirmed)
  }

  return {
    validator,
    status
  }
}

export const getSuccessExecutionTransaction = (
  web3: Web3,
  bridgeContract: Contract,
  fromHome: boolean,
  messageData: string,
  timestamp: number,
  getSuccessTransactions: (args: GetFailedTransactionParams) => Promise<APITransaction[]>
) => async (validatorData: BasicConfirmationParam): Promise<ConfirmationParam> => {
  const { validator } = validatorData
  const validatorCacheKey = `${CACHE_KEY_SUCCESS}${validatorData.validator}-${messageData}`
  const fromCache = validatorsCache.getData(validatorCacheKey)

  if (fromCache && fromCache.txHash) {
    return fromCache
  }

  const transactions = await getSuccessTransactions({
    account: validatorData.validator,
    to: bridgeContract.options.address,
    messageData,
    startTimestamp: timestamp,
    endTimestamp: timestamp + ONE_DAY_TIMESTAMP
  })

  let txHashTimestamp = 0
  let txHash = ''
  const status = VALIDATOR_CONFIRMATION_STATUS.SUCCESS

  if (transactions.length > 0) {
    const tx = transactions[0]
    txHashTimestamp = parseInt(tx.timeStamp)
    txHash = tx.hash

    // cache the result
    validatorsCache.setData(validatorCacheKey, {
      validator,
      status,
      txHash,
      timestamp: txHashTimestamp
    })
  }

  return {
    validator,
    status,
    txHash,
    timestamp: txHashTimestamp
  }
}

export const getValidatorFailedTransaction = (
  bridgeContract: Contract,
  messageData: string,
  timestamp: number,
  getFailedTransactions: (args: GetFailedTransactionParams) => Promise<APITransaction[]>
) => async (validatorData: BasicConfirmationParam): Promise<ConfirmationParam> => {
  const validatorCacheKey = `${CACHE_KEY_FAILED}${validatorData.validator}-${messageData}`
  const failedFromCache = validatorsCache.getData(validatorCacheKey)

  if (failedFromCache && failedFromCache.txHash) {
    return failedFromCache
  }

  const failedTransactions = await getFailedTransactions({
    account: validatorData.validator,
    to: bridgeContract.options.address,
    messageData,
    startTimestamp: timestamp,
    endTimestamp: timestamp + ONE_DAY_TIMESTAMP
  })
  const newStatus =
    failedTransactions.length > 0 ? VALIDATOR_CONFIRMATION_STATUS.FAILED : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED

  let txHashTimestamp = 0
  let txHash = ''
  // If validator signature failed, we cache the result to avoid doing future requests for a result that won't change
  if (failedTransactions.length > 0) {
    const failedTx = failedTransactions[0]
    txHashTimestamp = parseInt(failedTx.timeStamp)
    txHash = failedTx.hash

    validatorsCache.setData(validatorCacheKey, {
      validator: validatorData.validator,
      status: newStatus,
      txHash,
      timestamp: txHashTimestamp
    })
  }

  return {
    validator: validatorData.validator,
    status: newStatus,
    txHash,
    timestamp: txHashTimestamp
  }
}

export const getValidatorPendingTransaction = (
  bridgeContract: Contract,
  messageData: string,
  getPendingTransactions: (args: GetPendingTransactionParams) => Promise<APIPendingTransaction[]>
) => async (validatorData: BasicConfirmationParam): Promise<ConfirmationParam> => {
  const failedTransactions = await getPendingTransactions({
    account: validatorData.validator,
    to: bridgeContract.options.address,
    messageData
  })

  const newStatus =
    failedTransactions.length > 0 ? VALIDATOR_CONFIRMATION_STATUS.PENDING : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED

  let timestamp = 0
  let txHash = ''

  if (failedTransactions.length > 0) {
    const failedTx = failedTransactions[0]
    timestamp = Math.floor(new Date().getTime() / 1000.0)
    txHash = failedTx.hash
  }

  return {
    validator: validatorData.validator,
    status: newStatus,
    txHash,
    timestamp
  }
}
