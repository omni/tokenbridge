import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { HOME_RPC_POLLING_INTERVAL, VALIDATOR_CONFIRMATION_STATUS } from '../config/constants'
import { GetTransactionParams, APITransaction, APIPendingTransaction, GetPendingTransactionParams } from './explorer'
import {
  getValidatorConfirmation,
  getValidatorFailedTransaction,
  getValidatorPendingTransaction,
  getSuccessExecutionTransaction
} from './validatorConfirmationHelpers'
import { ConfirmationParam } from '../hooks/useMessageConfirmations'
import { signatureToVRS } from './signatures'

const mergeConfirmations = (oldConfirmations: ConfirmationParam[], newConfirmations: ConfirmationParam[]) => {
  const confirmations = [...oldConfirmations]
  newConfirmations.forEach(validatorData => {
    const index = confirmations.findIndex(e => e.validator === validatorData.validator)
    if (index === -1) {
      confirmations.push(validatorData)
      return
    }
    const currentStatus = confirmations[index].status
    const newStatus = validatorData.status
    if (
      validatorData.txHash ||
      !!validatorData.signature ||
      (newStatus !== currentStatus && newStatus !== VALIDATOR_CONFIRMATION_STATUS.UNDEFINED)
    ) {
      confirmations[index] = {
        status: validatorData.status,
        validator: validatorData.validator,
        timestamp: confirmations[index].timestamp || validatorData.timestamp,
        txHash: confirmations[index].txHash || validatorData.txHash,
        signature: confirmations[index].signature || validatorData.signature
      }
    }
  })
  return confirmations
}

export const getConfirmationsForTx = async (
  messageData: string,
  web3: Web3,
  validatorList: string[],
  bridgeContract: Contract,
  fromHome: boolean,
  setResult: Function,
  requiredSignatures: number,
  setSignatureCollected: Function,
  setTimeoutId: (timeoutId: number) => void,
  isCancelled: () => boolean,
  startBlock: number,
  getFailedTransactions: (args: GetTransactionParams) => Promise<APITransaction[]>,
  setFailedConfirmations: Function,
  getPendingTransactions: (args: GetPendingTransactionParams) => Promise<APIPendingTransaction[]>,
  setPendingConfirmations: Function,
  getSuccessTransactions: (args: GetTransactionParams) => Promise<APITransaction[]>
) => {
  const hashMsg = web3.utils.soliditySha3Raw(messageData)
  let validatorConfirmations = await Promise.all(
    validatorList.map(getValidatorConfirmation(web3, hashMsg, bridgeContract, fromHome))
  )

  const updateConfirmations = (confirmations: ConfirmationParam[]) => {
    if (confirmations.length === 0) {
      return
    }
    validatorConfirmations = mergeConfirmations(validatorConfirmations, confirmations)
    setResult((currentConfirmations: ConfirmationParam[]) => {
      if (currentConfirmations && currentConfirmations.length) {
        return mergeConfirmations(currentConfirmations, confirmations)
      }
      return confirmations
    })
  }

  const successConfirmations = validatorConfirmations.filter(c => c.status === VALIDATOR_CONFIRMATION_STATUS.SUCCESS)
  const notSuccessConfirmations = validatorConfirmations.filter(c => c.status !== VALIDATOR_CONFIRMATION_STATUS.SUCCESS)
  const hasEnoughSignatures = successConfirmations.length >= requiredSignatures

  updateConfirmations(validatorConfirmations)
  setSignatureCollected(hasEnoughSignatures)

  if (hasEnoughSignatures) {
    setPendingConfirmations(false)
    if (fromHome) {
      // fetch collected signatures for possible manual processing
      const signatures = await Promise.all(
        Array.from(Array(requiredSignatures).keys()).map(i => bridgeContract.methods.signature(hashMsg, i).call())
      )
      const confirmations = signatures.flatMap(sig => {
        const { v, r, s } = signatureToVRS(sig)
        const address = web3.eth.accounts.recover(messageData, `0x${v}`, `0x${r}`, `0x${s}`)
        return successConfirmations.filter(c => c.validator === address).map(c => ({ ...c, signature: sig }))
      })
      updateConfirmations(confirmations)
    }
  }

  // get transactions from success signatures
  const successConfirmationWithData = await Promise.all(
    successConfirmations.map(
      getSuccessExecutionTransaction(web3, bridgeContract, fromHome, messageData, startBlock, getSuccessTransactions)
    )
  )

  const successConfirmationWithTxFound = successConfirmationWithData.filter(v => v.txHash !== '')
  updateConfirmations(successConfirmationWithTxFound)

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
  }

  const undefinedConfirmations = validatorConfirmations.filter(
    c => c.status === VALIDATOR_CONFIRMATION_STATUS.UNDEFINED
  )

  // Check if confirmation failed
  const validatorFailedConfirmationsChecks = await Promise.all(
    undefinedConfirmations.map(
      getValidatorFailedTransaction(web3, bridgeContract, messageData, startBlock, getFailedTransactions)
    )
  )
  let validatorFailedConfirmations = validatorFailedConfirmationsChecks.filter(
    c => c.status === VALIDATOR_CONFIRMATION_STATUS.FAILED || c.status === VALIDATOR_CONFIRMATION_STATUS.FAILED_VALID
  )
  if (hasEnoughSignatures && !fromHome) {
    const lastTS = Math.max(...successConfirmationWithTxFound.map(c => c.timestamp || 0))
    validatorFailedConfirmations = validatorFailedConfirmations.map(
      c =>
        c.timestamp < lastTS
          ? c
          : {
              ...c,
              status: VALIDATOR_CONFIRMATION_STATUS.FAILED_VALID
            }
    )
  }
  setFailedConfirmations(
    !hasEnoughSignatures && validatorFailedConfirmations.some(c => c.status === VALIDATOR_CONFIRMATION_STATUS.FAILED)
  )
  updateConfirmations(validatorFailedConfirmations)

  const missingConfirmations = validatorConfirmations.filter(
    c => c.status === VALIDATOR_CONFIRMATION_STATUS.UNDEFINED || c.status === VALIDATOR_CONFIRMATION_STATUS.PENDING
  )

  if (hasEnoughSignatures) {
    // If signatures collected, it should set other signatures not found as not required
    const notRequiredConfirmations = missingConfirmations.map(c => ({
      validator: c.validator,
      status: VALIDATOR_CONFIRMATION_STATUS.NOT_REQUIRED,
      timestamp: 0,
      txHash: ''
    }))
    updateConfirmations(notRequiredConfirmations)
  }

  // retry if not all signatures are collected and some confirmations are still missing
  // or some success transactions were not fetched successfully
  if (
    (!hasEnoughSignatures && missingConfirmations.length > 0) ||
    successConfirmationWithTxFound.length < successConfirmationWithData.length
  ) {
    if (!isCancelled()) {
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
            setTimeoutId,
            isCancelled,
            startBlock,
            getFailedTransactions,
            setFailedConfirmations,
            getPendingTransactions,
            setPendingConfirmations,
            getSuccessTransactions
          ),
        HOME_RPC_POLLING_INTERVAL
      )
      setTimeoutId(timeoutId)
    }
  }
}
