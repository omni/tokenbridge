import React, { createContext, ReactNode, useState } from 'react'
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
import { foreignSnapshotProvider, homeSnapshotProvider } from '../services/SnapshotProvider'

export interface BaseNetworkParams {
  chainId: number
  name: string
  web3: Maybe<Web3>
  bridgeAddress: string
  bridgeContract: Maybe<Contract>
}

export interface StateContext {
  home: BaseNetworkParams
  foreign: BaseNetworkParams
  loading: boolean
  error: string
  setError: Function
}

const initialState = {
  home: {
    chainId: 0,
    name: '',
    web3: null,
    bridgeAddress: HOME_BRIDGE_ADDRESS,
    bridgeContract: null
  },
  foreign: {
    chainId: 0,
    name: '',
    web3: null,
    bridgeAddress: FOREIGN_BRIDGE_ADDRESS,
    bridgeContract: null
  },
  loading: true,
  error: '',
  setError: () => {}
}

const StateContext = createContext<StateContext>(initialState)

export const StateProvider = ({ children }: { children: ReactNode }) => {
  const homeNetwork = useNetwork(HOME_RPC_URL, homeSnapshotProvider)
  const foreignNetwork = useNetwork(FOREIGN_RPC_URL, foreignSnapshotProvider)
  const { homeBridge, foreignBridge } = useBridgeContracts({
    homeWeb3: homeNetwork.web3,
    foreignWeb3: foreignNetwork.web3
  })
  const [error, setError] = useState('')

  const value = {
    home: {
      bridgeAddress: HOME_BRIDGE_ADDRESS,
      name: HOME_NETWORK_NAME,
      bridgeContract: homeBridge,
      ...homeNetwork
    },
    foreign: {
      bridgeAddress: FOREIGN_BRIDGE_ADDRESS,
      name: FOREIGN_NETWORK_NAME,
      bridgeContract: foreignBridge,
      ...foreignNetwork
    },
    loading: homeNetwork.loading || foreignNetwork.loading,
    error,
    setError
  }

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>
}

export const useStateProvider = (): StateContext => {
  return React.useContext(StateContext)
}
