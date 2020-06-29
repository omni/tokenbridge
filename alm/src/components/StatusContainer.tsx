import React, { useEffect } from 'react'
import { Link, useHistory, useParams } from 'react-router-dom'
import { useTransactionStatus } from '../hooks/useTransactionStatus'
import { formatTxHash, getExplorerTxUrl, getTransactionStatusDescription, validTxHash } from '../utils/networks'
import { TRANSACTION_STATUS } from '../config/constants'
import { MessageSelector } from './MessageSelector'
import { Loading } from './commons/Loading'
import { useStateProvider } from '../state/StateProvider'
import { ExplorerTxLink } from './commons/ExplorerTxLink'
import { ConfirmationsContainer } from './ConfirmationsContainer'
import { LeftArrow } from './commons/LeftArrow'
import styled from 'styled-components'
import { TransactionReceipt } from 'web3-eth'

const BackButton = styled.button`
  color: var(--button-color);
  border-color: var(--font-color);
  margin-top: 10px;
  &:focus {
    outline: var(--button-color);
  }
`

const BackLabel = styled.label`
  margin-left: 5px;
  cursor: pointer;
`

export interface StatusContainerParam {
  onBackToMain: () => void
  setNetworkFromParams: (chainId: number) => void
  receiptParam: Maybe<TransactionReceipt>
}

export const StatusContainer = ({ onBackToMain, setNetworkFromParams, receiptParam }: StatusContainerParam) => {
  const { home, foreign } = useStateProvider()
  const history = useHistory()
  const { chainId, txHash, messageIdParam } = useParams()
  const validChainId = chainId === home.chainId.toString() || chainId === foreign.chainId.toString()
  const validParameters = validChainId && validTxHash(txHash)

  const { messages, receipt, status, description, timestamp, loading } = useTransactionStatus({
    txHash: validParameters ? txHash : '',
    chainId: validParameters ? parseInt(chainId) : 0,
    receiptParam
  })

  const selectedMessageId = messageIdParam === undefined || messages[messageIdParam] === undefined ? -1 : messageIdParam

  useEffect(
    () => {
      if (validChainId) {
        setNetworkFromParams(parseInt(chainId))
      }
    },
    [validChainId, chainId, setNetworkFromParams]
  )

  if (!validParameters && home.chainId && foreign.chainId) {
    return (
      <div>
        <p>
          Chain Id: {chainId} and/or Transaction Hash: {txHash} are not valid
        </p>
      </div>
    )
  }

  if (loading) {
    return <Loading />
  }

  const onMessageSelected = (messageId: number) => {
    history.push(`/${chainId}/${txHash}/${messageId}`)
  }

  const displayMessageSelector = status === TRANSACTION_STATUS.SUCCESS_MULTIPLE_MESSAGES && selectedMessageId === -1
  const multiMessageSelected = status === TRANSACTION_STATUS.SUCCESS_MULTIPLE_MESSAGES && selectedMessageId !== -1
  const displayReference = multiMessageSelected ? messages[selectedMessageId].id : txHash
  const formattedMessageId = formatTxHash(displayReference)

  const displayedDescription = multiMessageSelected
    ? getTransactionStatusDescription(TRANSACTION_STATUS.SUCCESS_ONE_MESSAGE, timestamp)
    : description

  const isHome = chainId === home.chainId.toString()
  const txExplorerLink = getExplorerTxUrl(txHash, isHome)
  const displayExplorerLink = status !== TRANSACTION_STATUS.NOT_FOUND

  const displayConfirmations = status === TRANSACTION_STATUS.SUCCESS_ONE_MESSAGE || multiMessageSelected
  const messageToConfirm =
    messages.length > 1 ? messages[selectedMessageId] : messages.length > 0 ? messages[0] : { id: '', data: '' }
  return (
    <div>
      {status && (
        <p>
          The request{' '}
          {displayExplorerLink && (
            <ExplorerTxLink href={txExplorerLink} target="blank">
              {formattedMessageId}
            </ExplorerTxLink>
          )}
          {!displayExplorerLink && <label>{formattedMessageId}</label>} {displayedDescription}
        </p>
      )}
      {displayMessageSelector && <MessageSelector messages={messages} onMessageSelected={onMessageSelected} />}
      {displayConfirmations && (
        <ConfirmationsContainer message={messageToConfirm} receipt={receipt} fromHome={isHome} timestamp={timestamp} />
      )}
      <div className="row is-center">
        <div className="col-9">
          <Link to="/" onClick={onBackToMain}>
            <BackButton className="button outline is-left">
              <LeftArrow />
              <BackLabel>Search another transaction</BackLabel>
            </BackButton>
          </Link>
        </div>
      </div>
    </div>
  )
}
