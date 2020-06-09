import React from 'react'
import ReactDOM from 'react-dom'
import { ThemeProvider } from 'styled-components'
import { GlobalStyle } from './themes/GlobalStyle'
import App from './App'
import Dark from './themes/Dark'

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={Dark}>
      <GlobalStyle />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
