import { createGlobalStyle } from 'styled-components'

import theme from './Dark'

type ThemeType = typeof theme

export const GlobalStyle = createGlobalStyle<{ theme: ThemeType }>`
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  :root {
    --bg-color: ${props => props.theme.backgroundColor};
    --font-color: ${props => props.theme.fontColor};
    --color-primary: ${props => props.theme.colorPrimary};
    --color-grey: ${props => props.theme.colorGrey};
    --color-lightGrey: ${props => props.theme.colorLightGrey};
    --link-color: ${props => props.theme.linkColor};
    --success-color: ${props => props.theme.success.textColor};
    --success-bg-color: ${props => props.theme.success.backgroundColor};
  }
`
