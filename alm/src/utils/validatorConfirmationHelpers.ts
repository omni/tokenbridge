import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { ConfirmationParam } from '../hooks/useMessageConfirmations'
import validatorsCache from '../services/ValidatorsCache'
import { CACHE_KEY_FAILED, CACHE_KEY_SUCCESS, VALIDATOR_CONFIRMATION_STATUS } from '../config/constants'
import { APIPendingTransaction, APITransaction, GetTransactionParams, GetPendingTransactionParams } from './explorer'
import { homeBlockNumberProvider } from '../services/BlockNumberProvider'
import { getAffirmationsSigned, getMessagesSigned } from './contract'

export const getValidatorConfirmation = (
  web3: Web3,
  hashMsg: string,
  bridgeContract: Contract,
  fromHome: boolean
) => async (validator: string): Promise<ConfirmationParam> => {
  const hashSenderMsg = web3.utils.soliditySha3Raw(validator, hashMsg)

  const fromCache = validatorsCache.getData(hashSenderMsg)
  if (fromCache) {
    return fromCache
  }

  const confirmationContractMethod = fromHome ? getMessagesSigned : getAffirmationsSigned
  const confirmed = await confirmationContractMethod(bridgeContract, hashSenderMsg)

  // If validator confirmed signature, we cache the result to avoid doing future requests for a result that won't change
  if (confirmed) {
    const confirmation: ConfirmationParam = {
      status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS,
      validator,
      timestamp: 0,
      txHash: ''
    }
    validatorsCache.setData(hashSenderMsg, confirmation)
    return confirmation
  }

  return {
    status: VALIDATOR_CONFIRMATION_STATUS.UNDEFINED,
    validator,
    timestamp: 0,
    txHash: ''
  }
}

export const getSuccessExecutionTransaction = (
  web3: Web3,
  bridgeContract: Contract,
  fromHome: boolean,
  messageData: string,
  startBlock: number,
  getSuccessTransactions: (args: GetTransactionParams) => Promise<APITransaction[]>
) => async (validatorData: ConfirmationParam): Promise<ConfirmationParam> => {
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
    startBlock,
    endBlock: homeBlockNumberProvider.get() || 0
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
  web3: Web3,
  bridgeContract: Contract,
  messageData: string,
  startBlock: number,
  getFailedTransactions: (args: GetTransactionParams) => Promise<APITransaction[]>
) => async (validatorData: ConfirmationParam): Promise<ConfirmationParam> => {
  const validatorCacheKey = `${CACHE_KEY_FAILED}${validatorData.validator}-${messageData}`
  const failedFromCache = validatorsCache.getData(validatorCacheKey)

  if (failedFromCache && failedFromCache.txHash) {
    return failedFromCache
  }

  const failedTransactions = await getFailedTransactions({
    account: validatorData.validator,
    to: bridgeContract.options.address,
    messageData,
    startBlock,
    endBlock: homeBlockNumberProvider.get() || 0
  })
  // If validator signature failed, we cache the result to avoid doing future requests for a result that won't change
  if (failedTransactions.length > 0) {
    const failedTx = failedTransactions[0]
    const confirmation: ConfirmationParam = {
      status: VALIDATOR_CONFIRMATION_STATUS.FAILED,
      validator: validatorData.validator,
      txHash: failedTx.hash,
      timestamp: parseInt(failedTx.timeStamp)
    }

    if (failedTx.input && failedTx.input.length > 10) {
      try {
        const res = web3.eth.abi.decodeParameters(['bytes', 'bytes'], `0x${failedTx.input.slice(10)}`)
        confirmation.signature = res[0]
        confirmation.status = VALIDATOR_CONFIRMATION_STATUS.FAILED_VALID
        console.log(`Adding manual signature from failed message from ${validatorData.validator}`)
      } catch {}
    }
    validatorsCache.setData(validatorCacheKey, confirmation)
    return confirmation
  }

  return {
    status: VALIDATOR_CONFIRMATION_STATUS.UNDEFINED,
    validator: validatorData.validator,
    txHash: '',
    timestamp: 0
  }
}

export const getValidatorPendingTransaction = (
  bridgeContract: Contract,
  messageData: string,
  getPendingTransactions: (args: GetPendingTransactionParams) => Promise<APIPendingTransaction[]>
) => async (validatorData: ConfirmationParam): Promise<ConfirmationParam> => {
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
