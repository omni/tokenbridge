import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { HOME_RPC_POLLING_INTERVAL, VALIDATOR_CONFIRMATION_STATUS } from '../config/constants'
import {
  GetFailedTransactionParams,
  APITransaction,
  APIPendingTransaction,
  GetPendingTransactionParams
} from './explorer'
import {
  getValidatorConfirmation,
  getValidatorFailedTransaction,
  getValidatorPendingTransaction,
  getValidatorSuccessTransaction
} from './validatorConfirmationHelpers'

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
