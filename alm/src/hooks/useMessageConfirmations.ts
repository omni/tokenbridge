import { useStateProvider } from '../state/StateProvider'
import { TransactionReceipt } from 'web3-eth'
import { MessageObject } from '../utils/web3'
import { useEffect, useState } from 'react'
import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { getAffirmationsSigned, getMessagesSigned } from '../utils/contract'
import { CONFIRMATIONS_STATUS, HOME_RPC_POLLING_INTERVAL, VALIDATOR_CONFIRMATION_STATUS } from '../config/constants'
import { getValidatorSignatureCache, setValidatorSignatureCache } from '../utils/validators'

export interface useMessageConfirmationsParams {
  message: MessageObject
  receipt: Maybe<TransactionReceipt>
  fromHome: boolean
}

export interface ConfirmationParam {
  validator: string
  status: string
}

export const useMessageConfirmations = ({ message, receipt, fromHome }: useMessageConfirmationsParams) => {
  const { home, foreign } = useStateProvider()
  const [confirmations, setConfirmations] = useState<Array<ConfirmationParam>>([])
  const [status, setStatus] = useState(CONFIRMATIONS_STATUS.UNDEFINED)

  useEffect(
    () => {
      const subscriptions: Array<number> = []

      const unsubscribe = () => {
        subscriptions.forEach(s => {
          clearTimeout(s)
        })
      }

      const confirmationContractMethod = fromHome ? getMessagesSigned : getAffirmationsSigned

      const getConfirmationsForTx = async (
        messageData: string,
        web3: Maybe<Web3>,
        validatorList: string[],
        bridgeContract: Maybe<Contract>,
        confirmationContractMethod: Function,
        setResult: Function,
        requiredSignatures: number
      ) => {
        if (!web3 || !validatorList || !bridgeContract) return
        const hashMsg = web3.utils.soliditySha3Raw(messageData)
        let validatorConfirmations = await Promise.all(
          validatorList.map(async validator => {
            const hashSenderMsg = web3.utils.soliditySha3Raw(validator, hashMsg)

            const signatureFromCache = getValidatorSignatureCache(hashSenderMsg)
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
              setValidatorSignatureCache(hashSenderMsg, confirmed)
            }

            return {
              validator,
              status
            }
          })
        )

        const successConfirmations = validatorConfirmations.filter(
          c => c.status === VALIDATOR_CONFIRMATION_STATUS.SUCCESS
        )

        // If signatures not collected, it needs to retry in the next blocks
        if (successConfirmations.length !== requiredSignatures) {
          setStatus(CONFIRMATIONS_STATUS.SUCCESS)
          const timeoutId = setTimeout(
            () =>
              getConfirmationsForTx(
                messageData,
                web3,
                validatorList,
                bridgeContract,
                confirmationContractMethod,
                setResult,
                requiredSignatures
              ),
            HOME_RPC_POLLING_INTERVAL
          )
          subscriptions.push(timeoutId)
        } else {
          // If signatures collected, it should set other signatures as not required
          const notSuccessConfirmations = validatorConfirmations.filter(
            c => c.status !== VALIDATOR_CONFIRMATION_STATUS.SUCCESS
          )
          const notRequiredConfirmations = notSuccessConfirmations.map(c => ({
            validator: c.validator,
            status: VALIDATOR_CONFIRMATION_STATUS.NOT_REQUIRED
          }))

          validatorConfirmations = [...successConfirmations, ...notRequiredConfirmations]
        }
        setResult(validatorConfirmations)
      }

      getConfirmationsForTx(
        message.data,
        home.web3,
        home.validatorList,
        home.bridgeContract,
        confirmationContractMethod,
        setConfirmations,
        home.requiredSignatures
      )

      return () => {
        unsubscribe()
      }
    },
    [fromHome, message.data, home.web3, home.validatorList, home.bridgeContract, home.requiredSignatures]
  )

  useEffect(
    () => {
      if (!confirmations.length) return
      const successConfirmations = confirmations.filter(c => c.status === VALIDATOR_CONFIRMATION_STATUS.SUCCESS)
      if (successConfirmations.length === home.requiredSignatures) {
        setStatus(CONFIRMATIONS_STATUS.SUCCESS)
      }
    },
    [confirmations, home.requiredSignatures]
  )

  return {
    confirmations,
    status
  }
}
