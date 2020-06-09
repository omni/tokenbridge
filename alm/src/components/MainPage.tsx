import React from 'react'
import styled from 'styled-components'
import { Route, useHistory } from 'react-router-dom'
import { Form } from './Form'
import { StatusContainer } from './StatusContainer'
import { StateProvider } from '../state/StateProvider'

const StyledMainPage = styled.div`
  text-align: center;
  min-height: 100vh;
`

const Header = styled.header`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
`

export interface FormSubmitParams {
  chainId: number
  txHash: string
}

export const MainPage = () => {
  const history = useHistory()
  const onFormSubmit = ({ chainId, txHash }: FormSubmitParams) => {
    history.push(`/${chainId}/${txHash}`)
  }

  return (
    <StateProvider>
      <StyledMainPage>
        <Header>
          <p>AMB Live Monitoring</p>
        </Header>
        <div className="container">
          <Route
            path={['/:chainId/:txHash/:messageIdParam', '/:chainId/:txHash', '/']}
            children={<Form onSubmit={onFormSubmit} />}
          />
          <Route path={['/:chainId/:txHash/:messageIdParam', '/:chainId/:txHash']} children={<StatusContainer />} />
        </div>
      </StyledMainPage>
    </StateProvider>
  )
}
