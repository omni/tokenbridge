import React from 'react'
import ReactDOM from 'react-dom'
import { ThemeProvider } from 'styled-components'
import { GlobalStyle } from './themes/GlobalStyle'
import App from './App'
import Light from './themes/Light'

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={Light}>
      <GlobalStyle />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
