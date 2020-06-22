import { useEffect, useState } from 'react'
import { HOME_AMB_ABI, FOREIGN_AMB_ABI } from '../../../commons'
import { FOREIGN_BRIDGE_ADDRESS, HOME_BRIDGE_ADDRESS } from '../config/constants'
import { Contract } from 'web3-eth-contract'
import Web3 from 'web3'
import { getRequiredBlockConfirmations } from '../utils/contract'

export interface useBridgeContractsParams {
  homeWeb3: Web3
  foreignWeb3: Web3
}

export const useBridgeContracts = ({ homeWeb3, foreignWeb3 }: useBridgeContractsParams) => {
  const [homeBridge, setHomeBridge] = useState<Maybe<Contract>>(null)
  const [foreignBridge, setForeignBridge] = useState<Maybe<Contract>>(null)
  const [homeBlockConfirmations, setHomeBlockConfirmations] = useState(0)
  const [foreignBlockConfirmations, setForeignBlockConfirmations] = useState(0)

  const callRequireBlockConfirmations = async (contract: Maybe<Contract>, setResult: Function) => {
    if (!contract) return
    const result = await getRequiredBlockConfirmations(contract)
    setResult(result)
  }

  useEffect(
    () => {
      if (!homeWeb3) return
      const homeContract = new homeWeb3.eth.Contract(HOME_AMB_ABI, HOME_BRIDGE_ADDRESS)
      callRequireBlockConfirmations(homeContract, setHomeBlockConfirmations)
      setHomeBridge(homeContract)
    },
    [homeWeb3]
  )

  useEffect(
    () => {
      if (!foreignWeb3) return
      const foreignContract = new foreignWeb3.eth.Contract(FOREIGN_AMB_ABI, FOREIGN_BRIDGE_ADDRESS)
      callRequireBlockConfirmations(foreignContract, setForeignBlockConfirmations)
      setForeignBridge(foreignContract)
    },
    [foreignWeb3]
  )

  return {
    homeBridge,
    foreignBridge,
    homeBlockConfirmations,
    foreignBlockConfirmations
  }
}
