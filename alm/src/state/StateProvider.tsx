import React, { createContext, ReactNode } from 'react'
import { useNetwork } from '../hooks/useNetwork'
import {
  HOME_RPC_URL,
  FOREIGN_RPC_URL,
  HOME_BRIDGE_ADDRESS,
  FOREIGN_BRIDGE_ADDRESS,
  HOME_NETWORK_NAME,
  FOREIGN_NETWORK_NAME
} from '../config/constants'
import Web3 from 'web3'
import { useBridgeContracts } from '../hooks/useBridgeContracts'
import { Contract } from 'web3-eth-contract'

export interface NetworkParams {
  chainId: number
  name: string
  web3: Maybe<Web3>
  bridgeAddress: string
  bridgeContract: Maybe<Contract>
  blockConfirmations: number
  validatorContract: Maybe<Contract>
  requiredSignatures: number
  validatorList: Array<string>
}

export interface StateContext {
  home: NetworkParams
  foreign: NetworkParams
  loading: boolean
}

const initialState = {
  home: {
    chainId: 0,
    name: '',
    web3: null,
    bridgeAddress: HOME_BRIDGE_ADDRESS,
    bridgeContract: null,
    blockConfirmations: 0,
    validatorContract: null,
    requiredSignatures: 0,
    validatorList: []
  },
  foreign: {
    chainId: 0,
    name: '',
    web3: null,
    bridgeAddress: FOREIGN_BRIDGE_ADDRESS,
    bridgeContract: null,
    blockConfirmations: 0,
    validatorContract: null,
    requiredSignatures: 0,
    validatorList: []
  },
  loading: true
}

const StateContext = createContext<StateContext>(initialState)

export const StateProvider = ({ children }: { children: ReactNode }) => {
  const homeNetwork = useNetwork(HOME_RPC_URL)
  const foreignNetwork = useNetwork(FOREIGN_RPC_URL)
  const {
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
  } = useBridgeContracts({
    homeWeb3: homeNetwork.web3,
    foreignWeb3: foreignNetwork.web3
  })

  const value = {
    home: {
      bridgeAddress: HOME_BRIDGE_ADDRESS,
      name: HOME_NETWORK_NAME,
      bridgeContract: homeBridge,
      blockConfirmations: homeBlockConfirmations,
      validatorContract: homeValidatorContract,
      requiredSignatures: homeRequiredSignatures,
      validatorList: homeValidatorList,
      ...homeNetwork
    },
    foreign: {
      bridgeAddress: FOREIGN_BRIDGE_ADDRESS,
      name: FOREIGN_NETWORK_NAME,
      bridgeContract: foreignBridge,
      blockConfirmations: foreignBlockConfirmations,
      validatorContract: foreignValidatorContract,
      requiredSignatures: foreignRequiredSignatures,
      validatorList: foreignValidatorList,
      ...foreignNetwork
    },
    loading: homeNetwork.loading || foreignNetwork.loading
  }

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>
}

export const useStateProvider = (): StateContext => {
  return React.useContext(StateContext)
}
