import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import validatorsCache from '../services/ValidatorsCache'
import { HOME_RPC_POLLING_INTERVAL, ONE_DAY_TIMESTAMP, VALIDATOR_CONFIRMATION_STATUS } from '../config/constants'
import { GetFailedTransactionParams, APITransaction } from './explorer'

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
  setFailedConfirmations: Function
) => {
  if (!web3 || !validatorList || !bridgeContract || !waitingBlocksResolved) return
  const hashMsg = web3.utils.soliditySha3Raw(messageData)
  let validatorConfirmations = await Promise.all(
    validatorList.map(async validator => {
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
    })
  )

  const successConfirmations = validatorConfirmations.filter(c => c.status === VALIDATOR_CONFIRMATION_STATUS.SUCCESS)

  const notSuccessConfirmations = validatorConfirmations.filter(c => c.status !== VALIDATOR_CONFIRMATION_STATUS.SUCCESS)

  // If signatures not collected, it needs to retry in the next blocks
  if (successConfirmations.length !== requiredSignatures) {
    // Check if confirmation failed
    const validatorFailedConfirmationsChecks = await Promise.all(
      notSuccessConfirmations.map(async validatorData => {
        const failedTransactions = await getFailedTransactions({
          account: validatorData.validator,
          to: bridgeContract.options.address,
          messageData,
          startTimestamp: timestamp,
          endTimestamp: timestamp + ONE_DAY_TIMESTAMP
        })
        const newStatus =
          failedTransactions.length > 0 ? VALIDATOR_CONFIRMATION_STATUS.FAILED : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED
        return {
          validator: validatorData.validator,
          status: newStatus
        }
      })
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
      c => c.status === VALIDATOR_CONFIRMATION_STATUS.UNDEFINED
    )

    if (missingConfirmations.length > 0) {
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
            setFailedConfirmations
          ),
        HOME_RPC_POLLING_INTERVAL
      )
      subscriptions.push(timeoutId)
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
  setResult(validatorConfirmations)
}
