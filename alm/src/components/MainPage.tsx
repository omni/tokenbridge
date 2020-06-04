import React from 'react'
import styled from 'styled-components'
import { Route, useHistory } from 'react-router-dom'
import { Form } from './Form'
import { StatusContainer } from './StatusContainer'
import { StateProvider } from '../state/StateProvider'

const StyledMainPage = styled.div`
  text-align: center;
  background-color: #282c34;
  min-height: 100vh;
  color: white;
`

const Header = styled.header`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
`

export interface FormSubmitParams {
  networkId: number
  txHash: string
}

export const MainPage = () => {
  const history = useHistory()
  const onFormSubmit = ({ networkId, txHash }: FormSubmitParams) => {
    history.push(`/${networkId}/${txHash}`)
  }

  return (
    <StateProvider>
      <StyledMainPage>
        <Header>
          <p>AMB Live Monitoring</p>
        </Header>
        <div className="container">
          <Form onSubmit={onFormSubmit} />
          <Route path="/:networkId/:txHash" children={<StatusContainer />} />
        </div>
      </StyledMainPage>
    </StateProvider>
  )
}
