import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { MainPage } from './components/MainPage'
import { StateProvider } from './state/StateProvider'

function App() {
  return (
    <BrowserRouter>
      <StateProvider>
        <MainPage />
      </StateProvider>
    </BrowserRouter>
  )
}

export default App
