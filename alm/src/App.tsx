import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Web3ReactProvider } from '@web3-react/core'
import Web3 from 'web3'
import { MainPage } from './components/MainPage'
import { StateProvider } from './state/StateProvider'

function App() {
  return (
    <BrowserRouter>
      <Web3ReactProvider getLibrary={provider => new Web3(provider)}>
        <StateProvider>
          <MainPage />
        </StateProvider>
      </Web3ReactProvider>
    </BrowserRouter>
  )
}

export default App
