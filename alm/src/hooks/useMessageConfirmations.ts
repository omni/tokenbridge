import { useStateProvider } from '../state/StateProvider'
import { TransactionReceipt } from 'web3-eth'
import { MessageObject } from '../utils/web3'
import { useEffect, useState } from 'react'
import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { getAffirmationsSigned, getMessagesSigned } from '../utils/contract'
import { CONFIRMATIONS_STATUS, VALIDATOR_CONFIRMATION_STATUS } from '../config/constants'

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

  const getConfirmationsFromHomeTx = async (
    messageData: string,
    web3: Maybe<Web3>,
    validatorList: string[],
    bridgeContract: Maybe<Contract>,
    confirmationContractMethod: Function,
    setResult: Function
  ) => {
    if (!web3 || !validatorList || !bridgeContract) return
    const hashMsg = web3.utils.soliditySha3Raw(messageData)
    const validatorConfirmations = await Promise.all(
      validatorList.map(async validator => {
        const hashSenderMsg = web3.utils.soliditySha3(validator, hashMsg)
        const confirmed = await confirmationContractMethod(bridgeContract, hashSenderMsg)
        const status = confirmed ? VALIDATOR_CONFIRMATION_STATUS.SUCCESS : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED
        return {
          validator,
          status
        }
      })
    )

    setResult(validatorConfirmations)
  }

  useEffect(
    () => {
      const confirmationContractMethod = fromHome ? getMessagesSigned : getAffirmationsSigned
      getConfirmationsFromHomeTx(
        message.data,
        home.web3,
        home.validatorList,
        home.bridgeContract,
        confirmationContractMethod,
        setConfirmations
      )
    },
    [fromHome, message.data, home.web3, home.validatorList, home.bridgeContract]
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
