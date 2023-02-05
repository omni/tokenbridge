import React, { useEffect, useState, useCallback } from 'react'
import styled from 'styled-components'
import { Route, useHistory } from 'react-router-dom'
import { Form } from './Form'
import { StatusContainer } from './StatusContainer'
import { useStateProvider } from '../state/StateProvider'
import { TransactionReceipt } from 'web3-eth'
import { InfoAlert } from './commons/InfoAlert'
import { ColonyLogo } from '../components/commons/Colony'
import { ExplorerTxLink } from './commons/ExplorerTxLink'
import { FOREIGN_NETWORK_NAME, HOME_NETWORK_NAME } from '../config/constants'

const StyledMainPage = styled.div`
  text-align: center;
  min-height: 100vh;
`

const LogoHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  svg {
    width: 140px;
  }
`

const Header = styled.header`
  background-color: rgb(246, 246, 246);
  color: rgb(60, 68, 77);
  font-weight: 600;
  margin-bottom: 50px;
  border: 1px solid rgb(232, 232, 232);
`

const HeaderContainer = styled.header`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  height: 70px;
  line-height: 64px;
  padding: 0 50px;

  @media (max-width: 600px) {
    padding: 0 20px;
  }
`

const AlertP = styled.p`
  align-items: start;
  margin-bottom: 0;
  @media (max-width: 600px) {
    flex-direction: column;
  }
`

export interface FormSubmitParams {
  chainId: number
  txHash: string
  receipt: TransactionReceipt
}

export const MainPage = () => {
  const history = useHistory()
  const { home, foreign } = useStateProvider()
  const [networkName, setNetworkName] = useState('')
  const [receipt, setReceipt] = useState<Maybe<TransactionReceipt>>(null)
  const [showInfoAlert, setShowInfoAlert] = useState(false)

  const loadFromStorage = useCallback(() => {
    const hideAlert = window.localStorage.getItem('hideInfoAlert')
    setShowInfoAlert(!hideAlert)
  }, [])

  useEffect(
    () => {
      loadFromStorage()
    },
    [loadFromStorage]
  )

  const onAlertClose = useCallback(
    () => {
      window.localStorage.setItem('hideInfoAlert', 'true')
      loadFromStorage()
    },
    [loadFromStorage]
  )

  const setNetworkData = (chainId: number) => {
    const network = chainId === home.chainId ? home.name : foreign.name

    setNetworkName(network)
  }

  const onFormSubmit = ({ chainId, txHash, receipt }: FormSubmitParams) => {
    setNetworkData(chainId)
    setReceipt(receipt)
    history.push(`/${chainId}/${txHash}`)
  }

  const resetNetworkHeader = () => {
    setNetworkName('')
  }

  const setNetworkFromParams = (chainId: number) => {
    setNetworkData(chainId)
  }

  useEffect(() => {
    const w = window as any
    if (w.ethereum) {
      w.ethereum.autoRefreshOnNetworkChange = false
    }
  }, [])

  return (
    <StyledMainPage>
      <Header>
        <HeaderContainer>
          <LogoHeader>
            <ColonyLogo />
            <span>Transaction Service</span>
          </LogoHeader>
          <span>{networkName}</span>
        </HeaderContainer>
      </Header>
      <div className="container">
        {showInfoAlert && (
          <InfoAlert onClick={onAlertClose}>
            <span className="is-left text-left">
              In order to execute the Safe transcation you will need to connect and cover the
              gas cost of the transaction on {FOREIGN_NETWORK_NAME}.
              This tool allows you to do this.
            </span>
            <span></span>
          </InfoAlert>
        )}
        <Route exact path={['/']} children={<Form onSubmit={onFormSubmit} />} />
        <Route
          path={['/:chainId/:txHash/:messageIdParam', '/:chainId/:txHash']}
          children={
            <StatusContainer
              onBackToMain={resetNetworkHeader}
              setNetworkFromParams={setNetworkFromParams}
              receiptParam={receipt}
            />
          }
        />
      </div>
    </StyledMainPage>
  )
}
