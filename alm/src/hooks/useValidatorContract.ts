import { useEffect, useState } from 'react'
import { Contract } from 'web3-eth-contract'
import Web3 from 'web3'
import { getRequiredSignatures, getValidatorAddress, getValidatorList } from '../utils/contract'
import { BRIDGE_VALIDATORS_ABI } from '../abis'
import { useStateProvider } from '../state/StateProvider'
import { TransactionReceipt } from 'web3-eth'
import { foreignSnapshotProvider, homeSnapshotProvider, SnapshotProvider } from '../services/SnapshotProvider'

export interface useValidatorContractParams {
  fromHome: boolean
  receipt: Maybe<TransactionReceipt>
}

export const useValidatorContract = ({ receipt, fromHome }: useValidatorContractParams) => {
  const [validatorContract, setValidatorContract] = useState<Maybe<Contract>>(null)
  const [requiredSignatures, setRequiredSignatures] = useState(0)
  const [validatorList, setValidatorList] = useState([])

  const { home, foreign } = useStateProvider()

  const callValidatorContract = async (
    bridgeContract: Maybe<Contract>,
    web3: Web3,
    setValidatorContract: Function,
    snapshotProvider: SnapshotProvider
  ) => {
    if (!web3 || !bridgeContract) return
    const address = await getValidatorAddress(bridgeContract, snapshotProvider)
    const contract = new web3.eth.Contract(BRIDGE_VALIDATORS_ABI, address)
    setValidatorContract(contract)
  }

  const callRequiredSignatures = async (
    contract: Maybe<Contract>,
    receipt: TransactionReceipt,
    setResult: Function
  ) => {
    if (!contract) return
    const result = await getRequiredSignatures(contract, receipt.blockNumber)
    setResult(result)
  }

  const callValidatorList = async (contract: Maybe<Contract>, receipt: TransactionReceipt, setResult: Function) => {
    if (!contract) return
    const result = await getValidatorList(contract, receipt.blockNumber)
    setResult(result)
  }

  useEffect(
    () => {
      const web3 = fromHome ? home.web3 : foreign.web3
      const bridgeContract = fromHome ? home.bridgeContract : foreign.bridgeContract
      const snapshotProvider = fromHome ? homeSnapshotProvider : foreignSnapshotProvider

      if (!web3 || !bridgeContract) return
      callValidatorContract(bridgeContract, web3, setValidatorContract, snapshotProvider)
    },
    [home.web3, foreign.web3, home.bridgeContract, foreign.bridgeContract, fromHome]
  )

  useEffect(
    () => {
      if (!receipt) return
      callRequiredSignatures(validatorContract, receipt, setRequiredSignatures)
      callValidatorList(validatorContract, receipt, setValidatorList)
    },
    [validatorContract, receipt]
  )

  return {
    requiredSignatures,
    validatorList
  }
}
