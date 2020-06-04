import React, { createContext, ReactNode } from 'react'

export interface NetworkParams {
  chainId: number
  name: string
}

export interface StateContext {
  home: NetworkParams
  foreign: NetworkParams
}

const initialState = {
  home: {
    chainId: 0,
    name: ''
  },
  foreign: {
    chainId: 0,
    name: ''
  }
}

const StateContext = createContext<StateContext>(initialState)

export const StateProvider = ({ children }: { children: ReactNode }) => {
  const value = {
    home: {
      chainId: 100,
      name: 'xDai Chain'
    },
    foreign: {
      chainId: 1,
      name: 'ETH Mainnet'
    }
  }

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>
}

export const useStateProvider = (): StateContext => {
  return React.useContext(StateContext)
}
