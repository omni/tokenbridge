import { useEffect, useState } from 'react'
import { Contract } from 'web3-eth-contract'
import Web3 from 'web3'
import { getRequiredSignatures, getValidatorAddress, getValidatorList } from '../utils/contract'
import { BRIDGE_VALIDATORS_ABI } from '../abis'
import { useStateProvider } from '../state/StateProvider'
import { foreignSnapshotProvider, homeSnapshotProvider, SnapshotProvider } from '../services/SnapshotProvider'
import { FOREIGN_EXPLORER_API, HOME_EXPLORER_API } from '../config/constants'

export const useValidatorContract = (isHome: boolean, blockNumber: number | 'latest') => {
  const [validatorContract, setValidatorContract] = useState<Maybe<Contract>>(null)
  const [requiredSignatures, setRequiredSignatures] = useState(0)
  const [validatorList, setValidatorList] = useState<string[]>([])

  const { home, foreign } = useStateProvider()

  const callValidatorContract = async (bridgeContract: Maybe<Contract>, web3: Web3, setValidatorContract: Function) => {
    if (!web3 || !bridgeContract) return
    const address = await getValidatorAddress(bridgeContract)
    const contract = new web3.eth.Contract(BRIDGE_VALIDATORS_ABI, address)
    setValidatorContract(contract)
  }

  const callRequiredSignatures = async (
    contract: Maybe<Contract>,
    blockNumber: number | 'latest',
    setResult: Function,
    snapshotProvider: SnapshotProvider,
    web3: Web3,
    api: string
  ) => {
    if (!contract) return
    const result = await getRequiredSignatures(contract, blockNumber, snapshotProvider, web3, api)
    setResult(result)
  }

  const callValidatorList = async (
    contract: Maybe<Contract>,
    blockNumber: number | 'latest',
    setResult: Function,
    snapshotProvider: SnapshotProvider,
    web3: Web3,
    api: string
  ) => {
    if (!contract) return
    const result = await getValidatorList(contract, blockNumber, snapshotProvider, web3, api)
    setResult(result)
  }

  const web3 = isHome ? home.web3 : foreign.web3
  const api = isHome ? HOME_EXPLORER_API : FOREIGN_EXPLORER_API
  const bridgeContract = isHome ? home.bridgeContract : foreign.bridgeContract
  const snapshotProvider = isHome ? homeSnapshotProvider : foreignSnapshotProvider

  useEffect(
    () => {
      if (!web3 || !bridgeContract) return
      callValidatorContract(bridgeContract, web3, setValidatorContract)
    },
    [web3, bridgeContract]
  )

  useEffect(
    () => {
      if (!web3 || !blockNumber) return
      callRequiredSignatures(validatorContract, blockNumber, setRequiredSignatures, snapshotProvider, web3, api)
      callValidatorList(validatorContract, blockNumber, setValidatorList, snapshotProvider, web3, api)
    },
    [validatorContract, blockNumber, web3, snapshotProvider, api]
  )

  return {
    requiredSignatures,
    validatorList
  }
}
