import { createGlobalStyle } from 'styled-components'

import theme from './Light'

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
    --button-color: ${props => props.theme.buttonColor};
    --color-primary: ${props => props.theme.colorPrimary};
    --color-grey: ${props => props.theme.colorGrey};
    --color-lightGrey: ${props => props.theme.colorLightGrey};
    --link-color: ${props => props.theme.linkColor};
    --success-color: ${props => props.theme.success.textColor};
    --success-bg-color: ${props => props.theme.success.backgroundColor};
    --not-required-color: ${props => props.theme.notRequired.textColor};
    --not-required-bg-color: ${props => props.theme.notRequired.backgroundColor};
    --failed-color: ${props => props.theme.failed.textColor};
    --failed-bg-color: ${props => props.theme.failed.backgroundColor};
  }
`
