import { useEffect, useState } from 'react'
import { Contract } from 'web3-eth-contract'
import Web3 from 'web3'
import { getRequiredSignatures, getValidatorAddress, getValidatorList } from '../utils/contract'
import { BRIDGE_VALIDATORS_ABI } from '../abis'
import { useStateProvider } from '../state/StateProvider'
import { TransactionReceipt } from 'web3-eth'
import { foreignSnapshotProvider, homeSnapshotProvider, SnapshotProvider } from '../services/SnapshotProvider'
import { FOREIGN_EXPLORER_API, HOME_EXPLORER_API } from '../config/constants'

export interface useValidatorContractParams {
  fromHome: boolean
  receipt: Maybe<TransactionReceipt>
}

export const useValidatorContract = ({ receipt, fromHome }: useValidatorContractParams) => {
  const [validatorContract, setValidatorContract] = useState<Maybe<Contract>>(null)
  const [requiredSignatures, setRequiredSignatures] = useState(0)
  const [validatorList, setValidatorList] = useState([])

  const { home, foreign } = useStateProvider()

  const callValidatorContract = async (bridgeContract: Maybe<Contract>, web3: Web3, setValidatorContract: Function) => {
    if (!web3 || !bridgeContract) return
    const address = await getValidatorAddress(bridgeContract)
    const contract = new web3.eth.Contract(BRIDGE_VALIDATORS_ABI, address)
    setValidatorContract(contract)
  }

  const callRequiredSignatures = async (
    contract: Maybe<Contract>,
    receipt: TransactionReceipt,
    setResult: Function,
    snapshotProvider: SnapshotProvider,
    web3: Web3,
    api: string
  ) => {
    if (!contract) return
    const result = await getRequiredSignatures(contract, receipt.blockNumber, snapshotProvider, web3, api)
    setResult(result)
  }

  const callValidatorList = async (
    contract: Maybe<Contract>,
    receipt: TransactionReceipt,
    setResult: Function,
    snapshotProvider: SnapshotProvider,
    web3: Web3,
    api: string
  ) => {
    if (!contract) return
    const result = await getValidatorList(contract, receipt.blockNumber, snapshotProvider, web3, api)
    setResult(result)
  }

  const web3 = fromHome ? home.web3 : foreign.web3
  const api = fromHome ? HOME_EXPLORER_API : FOREIGN_EXPLORER_API
  const bridgeContract = fromHome ? home.bridgeContract : foreign.bridgeContract
  const snapshotProvider = fromHome ? homeSnapshotProvider : foreignSnapshotProvider

  useEffect(
    () => {
      if (!web3 || !bridgeContract) return
      callValidatorContract(bridgeContract, web3, setValidatorContract)
    },
    [web3, bridgeContract]
  )

  useEffect(
    () => {
      if (!web3 || !receipt) return
      callRequiredSignatures(validatorContract, receipt, setRequiredSignatures, snapshotProvider, web3, api)
      callValidatorList(validatorContract, receipt, setValidatorList, snapshotProvider, web3, api)
    },
    [validatorContract, receipt, web3, snapshotProvider, api]
  )

  return {
    requiredSignatures,
    validatorList
  }
}
