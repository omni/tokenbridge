import React, { createContext, ReactNode } from 'react'
import { useNetwork } from '../hooks/useNetwork'
import { HOME_RPC_URL, FOREIGN_RPC_URL, HOME_BRIDGE_ADDRESS, FOREIGN_BRIDGE_ADDRESS } from '../config/constants'
import Web3 from 'web3'

export interface NetworkParams {
  chainId: number
  name: string
  web3: Maybe<Web3>
  bridgeAddress: string
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
    bridgeAddress: HOME_BRIDGE_ADDRESS
  },
  foreign: {
    chainId: 0,
    name: '',
    web3: null,
    bridgeAddress: FOREIGN_BRIDGE_ADDRESS
  },
  loading: true
}

const StateContext = createContext<StateContext>(initialState)

export const StateProvider = ({ children }: { children: ReactNode }) => {
  const homeNetwork = useNetwork(HOME_RPC_URL)
  const foreignNetwork = useNetwork(FOREIGN_RPC_URL)

  const value = {
    home: {
      bridgeAddress: HOME_BRIDGE_ADDRESS,
      ...homeNetwork
    },
    foreign: {
      bridgeAddress: FOREIGN_BRIDGE_ADDRESS,
      ...foreignNetwork
    },
    loading: homeNetwork.loading || foreignNetwork.loading
  }

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>
}

export const useStateProvider = (): StateContext => {
  return React.useContext(StateContext)
}
