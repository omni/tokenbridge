import React, { useEffect, useState, useCallback } from 'react'
import styled from 'styled-components'
import { Route, useHistory } from 'react-router-dom'
import { Form } from './Form'
import { StatusContainer } from './StatusContainer'
import { useStateProvider } from '../state/StateProvider'
import { TransactionReceipt } from 'web3-eth'
import { InfoAlert } from './commons/InfoAlert'
import { ExplorerTxLink } from './commons/ExplorerTxLink'
import { FOREIGN_NETWORK_NAME, HOME_NETWORK_NAME } from '../config/constants'
import { ErrorAlert } from './commons/ErrorAlert'

const StyledMainPage = styled.div`
  text-align: center;
  min-height: 100vh;
`

const Header = styled.header`
  background-color: #001529;
  color: #ffffff;
  margin-bottom: 50px;
`

const HeaderContainer = styled.header`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  height: 64px;
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
  const { home, foreign, error, setError } = useStateProvider()
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
          <span>AMB Live Monitoring</span>
          <span>{networkName}</span>
        </HeaderContainer>
      </Header>
      <div className="container">
        {showInfoAlert && (
          <InfoAlert onClick={onAlertClose}>
            <p className="is-left text-left">
              The Arbitrary Message Bridge Live Monitoring application provides real-time status updates for messages
              bridged between {HOME_NETWORK_NAME} and {FOREIGN_NETWORK_NAME}. You can check current tx status, view
              validator info, and troubleshoot potential issues with bridge transfers.
            </p>
            <AlertP className="is-left text-left">
              For more information refer to&nbsp;
              <ExplorerTxLink
                href="https://docs.tokenbridge.net/about-tokenbridge/components/amb-live-monitoring-application"
                target="_blank"
                rel="noopener noreferrer"
              >
                the ALM documentation
              </ExplorerTxLink>
            </AlertP>
          </InfoAlert>
        )}
        {error && <ErrorAlert onClick={() => setError('')} error={error} />}
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
