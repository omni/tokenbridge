import { useEffect, useState } from 'react'
import { HOME_AMB_ABI, FOREIGN_AMB_ABI, BRIDGE_VALIDATORS_ABI } from '../../../commons'
import { FOREIGN_BRIDGE_ADDRESS, HOME_BRIDGE_ADDRESS } from '../config/constants'
import { Contract } from 'web3-eth-contract'
import Web3 from 'web3'
import {
  getRequiredBlockConfirmations,
  getRequiredSignatures,
  getValidatorAddress,
  getValidatorList
} from '../utils/contract'

export interface useBridgeContractsParams {
  homeWeb3: Web3
  foreignWeb3: Web3
}

export const useBridgeContracts = ({ homeWeb3, foreignWeb3 }: useBridgeContractsParams) => {
  const [homeBridge, setHomeBridge] = useState<Maybe<Contract>>(null)
  const [foreignBridge, setForeignBridge] = useState<Maybe<Contract>>(null)
  const [homeBlockConfirmations, setHomeBlockConfirmations] = useState(0)
  const [foreignBlockConfirmations, setForeignBlockConfirmations] = useState(0)
  const [homeValidatorContract, setHomeValidatorContract] = useState<Maybe<Contract>>(null)
  const [foreignValidatorContract, setForeignValidatorContract] = useState<Maybe<Contract>>(null)
  const [homeRequiredSignatures, setHomeRequiredSignatures] = useState(0)
  const [foreignRequiredSignatures, setForeignRequiredSignatures] = useState(0)
  const [homeValidatorList, setHomeValidatorList] = useState([])
  const [foreignValidatorList, setForeignValidatorList] = useState([])

  const callRequireBlockConfirmations = async (contract: Maybe<Contract>, setResult: Function) => {
    if (!contract) return
    const result = await getRequiredBlockConfirmations(contract)
    setResult(result)
  }

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
      if (!homeWeb3) return
      const homeContract = new homeWeb3.eth.Contract(HOME_AMB_ABI, HOME_BRIDGE_ADDRESS)
      callRequireBlockConfirmations(homeContract, setHomeBlockConfirmations)
      callValidatorContract(homeContract, homeWeb3, setHomeValidatorContract)
      setHomeBridge(homeContract)
    },
    [homeWeb3]
  )

  useEffect(
    () => {
      if (!foreignWeb3) return
      const foreignContract = new foreignWeb3.eth.Contract(FOREIGN_AMB_ABI, FOREIGN_BRIDGE_ADDRESS)
      callRequireBlockConfirmations(foreignContract, setForeignBlockConfirmations)
      callValidatorContract(foreignContract, foreignWeb3, setForeignValidatorContract)
      setForeignBridge(foreignContract)
    },
    [foreignWeb3]
  )

  useEffect(
    () => {
      callRequiredSignatures(homeValidatorContract, setHomeRequiredSignatures)
      callValidatorList(homeValidatorContract, setHomeValidatorList)
    },
    [homeValidatorContract]
  )

  useEffect(
    () => {
      callRequiredSignatures(foreignValidatorContract, setForeignRequiredSignatures)
      callValidatorList(foreignValidatorContract, setForeignValidatorList)
    },
    [foreignValidatorContract]
  )

  return {
    homeBridge,
    foreignBridge,
    homeBlockConfirmations,
    foreignBlockConfirmations,
    homeValidatorContract,
    foreignValidatorContract,
    homeRequiredSignatures,
    foreignRequiredSignatures,
    homeValidatorList,
    foreignValidatorList
  }
}
