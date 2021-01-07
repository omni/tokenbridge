import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { HOME_RPC_POLLING_INTERVAL, VALIDATOR_CONFIRMATION_STATUS } from '../config/constants'
import {
  GetFailedTransactionParams,
  APITransaction,
  APIPendingTransaction,
  GetPendingTransactionParams
} from './explorer'
import { getAffirmationsSigned, getMessagesSigned } from './contract'
import {
  getValidatorConfirmation,
  getValidatorFailedTransaction,
  getValidatorPendingTransaction,
  getSuccessExecutionTransaction
} from './validatorConfirmationHelpers'
import { BasicConfirmationParam, ConfirmationParam } from '../hooks/useMessageConfirmations'

const mergeConfirmations = (oldConfirmations: BasicConfirmationParam[], newConfirmations: BasicConfirmationParam[]) => {
  const confirmations = [...oldConfirmations]
  newConfirmations.forEach(validatorData => {
    const index = confirmations.findIndex(e => e.validator === validatorData.validator)
    const currentStatus = confirmations[index].status
    const newStatus = validatorData.status
    if (
      (validatorData as ConfirmationParam).txHash ||
      (newStatus !== currentStatus && newStatus !== VALIDATOR_CONFIRMATION_STATUS.UNDEFINED)
    ) {
      confirmations[index] = validatorData
    }
  })
  return confirmations
}

export const getConfirmationsForTx = async (
  messageData: string,
  web3: Maybe<Web3>,
  validatorList: string[],
  bridgeContract: Maybe<Contract>,
  fromHome: boolean,
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

  const confirmationContractMethod = fromHome ? getMessagesSigned : getAffirmationsSigned

  const hashMsg = web3.utils.soliditySha3Raw(messageData)
  let validatorConfirmations = await Promise.all(
    validatorList.map(getValidatorConfirmation(web3, hashMsg, bridgeContract, confirmationContractMethod))
  )

  const updateConfirmations = (confirmations: BasicConfirmationParam[]) => {
    if (confirmations.length === 0) {
      return
    }
    validatorConfirmations = mergeConfirmations(validatorConfirmations, confirmations)
    setResult((currentConfirmations: BasicConfirmationParam[]) => {
      if (currentConfirmations && currentConfirmations.length) {
        return mergeConfirmations(currentConfirmations, confirmations)
      }
      return confirmations
    })
  }

  const successConfirmations = validatorConfirmations.filter(c => c.status === VALIDATOR_CONFIRMATION_STATUS.SUCCESS)
  const notSuccessConfirmations = validatorConfirmations.filter(c => c.status !== VALIDATOR_CONFIRMATION_STATUS.SUCCESS)
  const hasEnoughSignatures = successConfirmations.length === requiredSignatures

  updateConfirmations(validatorConfirmations)
  setSignatureCollected(hasEnoughSignatures)

  // If signatures not collected, look for pending transactions
  if (!hasEnoughSignatures) {
    // Check if confirmation is pending
    const validatorPendingConfirmationsChecks = await Promise.all(
      notSuccessConfirmations.map(getValidatorPendingTransaction(bridgeContract, messageData, getPendingTransactions))
    )

    const validatorPendingConfirmations = validatorPendingConfirmationsChecks.filter(
      c => c.status === VALIDATOR_CONFIRMATION_STATUS.PENDING
    )
    updateConfirmations(validatorPendingConfirmations)
    setPendingConfirmations(validatorPendingConfirmations.length > 0)
  } else {
    setPendingConfirmations(false)
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
  setFailedConfirmations(validatorFailedConfirmations.length > validatorList.length - requiredSignatures)
  updateConfirmations(validatorFailedConfirmations)

  const missingConfirmations = validatorConfirmations.filter(
    c => c.status === VALIDATOR_CONFIRMATION_STATUS.UNDEFINED || c.status === VALIDATOR_CONFIRMATION_STATUS.PENDING
  )

  if (hasEnoughSignatures) {
    // If signatures collected, it should set other signatures not found as not required
    const notRequiredConfirmations = missingConfirmations.map(c => ({
      validator: c.validator,
      status: VALIDATOR_CONFIRMATION_STATUS.NOT_REQUIRED
    }))
    updateConfirmations(notRequiredConfirmations)

    if (fromHome) {
      // fetch collected signatures for possible manual processing
      setSignatureCollected(
        await Promise.all(
          Array.from(Array(requiredSignatures).keys()).map(i => bridgeContract.methods.signature(hashMsg, i).call())
        )
      )
    }
  }

  // get transactions from success signatures
  const successConfirmationWithData = await Promise.all(
    successConfirmations.map(
      getSuccessExecutionTransaction(web3, bridgeContract, fromHome, messageData, timestamp, getSuccessTransactions)
    )
  )

  const successConfirmationWithTxFound = successConfirmationWithData.filter(v => v.txHash !== '')
  updateConfirmations(successConfirmationWithTxFound)

  // retry if not all signatures are collected and some confirmations are still missing
  // or some success transactions were not fetched successfully
  if (
    (!hasEnoughSignatures && missingConfirmations.length > 0) ||
    successConfirmationWithTxFound.length < successConfirmationWithData.length
  ) {
    const timeoutId = setTimeout(
      () =>
        getConfirmationsForTx(
          messageData,
          web3,
          validatorList,
          bridgeContract,
          fromHome,
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
