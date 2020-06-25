import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import validatorsCache from '../services/ValidatorsCache'
import {
  CACHE_KEY_FAILED,
  CACHE_KEY_SUCCESS,
  HOME_RPC_POLLING_INTERVAL,
  ONE_DAY_TIMESTAMP,
  VALIDATOR_CONFIRMATION_STATUS
} from '../config/constants'
import {
  GetFailedTransactionParams,
  APITransaction,
  APIPendingTransaction,
  GetPendingTransactionParams
} from './explorer'
import { BasicConfirmationParam, ConfirmationParam } from '../hooks/useMessageConfirmations'

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

export const getValidatorSuccessTransaction = (
  bridgeContract: Contract,
  messageData: string,
  timestamp: number,
  getSuccessTransactions: (args: GetFailedTransactionParams) => Promise<APITransaction[]>
) => async (validatorData: BasicConfirmationParam): Promise<ConfirmationParam> => {
  const { validator } = validatorData
  const validatorCacheKey = `${CACHE_KEY_SUCCESS}${validatorData.validator}`
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
  const validatorCacheKey = `${CACHE_KEY_FAILED}${validatorData.validator}`
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

export const getConfirmationsForTx = async (
  messageData: string,
  web3: Maybe<Web3>,
  validatorList: string[],
  bridgeContract: Maybe<Contract>,
  confirmationContractMethod: Function,
  setResult: Function,
  requiredSignatures: number,
  setSignatureCollected: Function,
  waitingBlocksResolved: boolean,
  subscriptions: number[],
  timestamp: number,
  getFailedTransactions: (args: GetFailedTransactionParams) => Promise<APITransaction[]>,
  setFailedConfirmations: Function,
  getPendingTransactions: (args: GetPendingTransactionParams) => Promise<APIPendingTransaction[]>,
  setPendingConfirmations: Function,
  getSuccessTransactions: (args: GetFailedTransactionParams) => Promise<APITransaction[]>
) => {
  if (!web3 || !validatorList || !validatorList.length || !bridgeContract || !waitingBlocksResolved) return

  // If all the information was not collected, then it should retry
  let shouldRetry = false

  const hashMsg = web3.utils.soliditySha3Raw(messageData)
  let validatorConfirmations = await Promise.all(
    validatorList.map(getValidatorConfirmation(web3, hashMsg, bridgeContract, confirmationContractMethod))
  )

  const successConfirmations = validatorConfirmations.filter(c => c.status === VALIDATOR_CONFIRMATION_STATUS.SUCCESS)

  const notSuccessConfirmations = validatorConfirmations.filter(c => c.status !== VALIDATOR_CONFIRMATION_STATUS.SUCCESS)

  // If signatures not collected, it needs to retry in the next blocks
  if (successConfirmations.length !== requiredSignatures) {
    // Check if confirmation is pending
    const validatorPendingConfirmationsChecks = await Promise.all(
      notSuccessConfirmations.map(getValidatorPendingTransaction(bridgeContract, messageData, getPendingTransactions))
    )
    const validatorPendingConfirmations = validatorPendingConfirmationsChecks.filter(
      c => c.status === VALIDATOR_CONFIRMATION_STATUS.PENDING
    )

    validatorPendingConfirmations.forEach(validatorData => {
      const index = validatorConfirmations.findIndex(e => e.validator === validatorData.validator)
      validatorConfirmations[index] = validatorData
    })

    if (validatorPendingConfirmations.length > 0) {
      setPendingConfirmations(true)
    }

    const undefinedConfirmations = validatorConfirmations.filter(
      c => c.status === VALIDATOR_CONFIRMATION_STATUS.UNDEFINED
    )
    // Check if confirmation failed
    const validatorFailedConfirmationsChecks = await Promise.all(
      undefinedConfirmations.map(
        getValidatorFailedTransaction(bridgeContract, messageData, timestamp, getFailedTransactions)
      )
    )
    const validatorFailedConfirmations = validatorFailedConfirmationsChecks.filter(
      c => c.status === VALIDATOR_CONFIRMATION_STATUS.FAILED
    )
    validatorFailedConfirmations.forEach(validatorData => {
      const index = validatorConfirmations.findIndex(e => e.validator === validatorData.validator)
      validatorConfirmations[index] = validatorData
    })
    const messageConfirmationsFailed = validatorFailedConfirmations.length > validatorList.length - requiredSignatures
    if (messageConfirmationsFailed) {
      setFailedConfirmations(true)
    }

    const missingConfirmations = validatorConfirmations.filter(
      c => c.status === VALIDATOR_CONFIRMATION_STATUS.UNDEFINED || c.status === VALIDATOR_CONFIRMATION_STATUS.PENDING
    )

    if (missingConfirmations.length > 0) {
      shouldRetry = true
    }
  } else {
    // If signatures collected, it should set other signatures as not required
    const notRequiredConfirmations = notSuccessConfirmations.map(c => ({
      validator: c.validator,
      status: VALIDATOR_CONFIRMATION_STATUS.NOT_REQUIRED
    }))

    validatorConfirmations = [...successConfirmations, ...notRequiredConfirmations]
    setSignatureCollected(true)
  }

  // Set confirmations to update UI and continue requesting the transactions for the signatures
  setResult(validatorConfirmations)

  // get transactions from success signatures
  const successConfirmationWithData = await Promise.all(
    validatorConfirmations
      .filter(c => c.status === VALIDATOR_CONFIRMATION_STATUS.SUCCESS)
      .map(getValidatorSuccessTransaction(bridgeContract, messageData, timestamp, getSuccessTransactions))
  )

  const successConfirmationWithTxFound = successConfirmationWithData.filter(v => v.txHash !== '')

  const updatedValidatorConfirmations = [...validatorConfirmations]

  if (successConfirmationWithTxFound.length > 0) {
    successConfirmationWithTxFound.forEach(validatorData => {
      const index = updatedValidatorConfirmations.findIndex(e => e.validator === validatorData.validator)
      updatedValidatorConfirmations[index] = validatorData
    })
  }

  setResult(updatedValidatorConfirmations)

  // Retry if not all transaction were found for validator confirmations
  if (successConfirmationWithTxFound.length < successConfirmationWithData.length) {
    shouldRetry = true
  }

  if (shouldRetry) {
    const timeoutId = setTimeout(
      () =>
        getConfirmationsForTx(
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
        ),
      HOME_RPC_POLLING_INTERVAL
    )
    subscriptions.push(timeoutId)
  }
}
