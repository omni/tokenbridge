import { useEffect, useState } from 'react'
import { Contract } from 'web3-eth-contract'
import Web3 from 'web3'
import { getRequiredSignatures, getValidatorAddress, getValidatorList } from '../utils/contract'
import { BRIDGE_VALIDATORS_ABI } from '../../../commons'
import { useStateProvider } from '../state/StateProvider'
import { TransactionReceipt } from 'web3-eth'

export interface useValidatorContractParams {
  fromHome: boolean
  receipt: Maybe<TransactionReceipt>
}

export const useValidatorContract = ({ receipt, fromHome }: useValidatorContractParams) => {
  const [homeValidatorContract, setHomeValidatorContract] = useState<Maybe<Contract>>(null)
  const [requiredSignatures, setRequiredSignatures] = useState(0)
  const [validatorList, setValidatorList] = useState([])

  const { home, foreign } = useStateProvider()

  const callValidatorContract = async (bridgeContract: Maybe<Contract>, web3: Web3, setValidatorContract: Function) => {
    if (!web3 || !bridgeContract) return
    const address = await getValidatorAddress(bridgeContract)
    const contract = new web3.eth.Contract(BRIDGE_VALIDATORS_ABI, address)
    setValidatorContract(contract)
  }

  const callRequiredSignatures = async (contract: Maybe<Contract>, setResult: Function) => {
    if (!contract) return
    const result = await getRequiredSignatures(contract)
    setResult(result)
  }

  const callValidatorList = async (contract: Maybe<Contract>, setResult: Function) => {
    if (!contract) return
    const result = await getValidatorList(contract)
    setResult(result)
  }

  useEffect(
    () => {
      const web3 = fromHome ? home.web3 : foreign.web3
      const bridgeContract = fromHome ? home.bridgeContract : foreign.bridgeContract

      if (!web3 || !bridgeContract) return
      callValidatorContract(bridgeContract, web3, setHomeValidatorContract)
    },
    [home.web3, foreign.web3, home.bridgeContract, foreign.bridgeContract, fromHome]
  )

  useEffect(
    () => {
      callRequiredSignatures(homeValidatorContract, setRequiredSignatures)
      callValidatorList(homeValidatorContract, setValidatorList)
    },
    [homeValidatorContract]
  )

  return {
    requiredSignatures,
    validatorList
  }
}
