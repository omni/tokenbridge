import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useTransactionStatus } from '../hooks/useTransactionStatus'
import { formatTxHash, getTransactionStatusDescription, validTxHash } from '../utils/networks'
import { TRANSACTION_STATUS } from '../config/constants'
import { MessageSelector } from './MessageSelector'
import { Loading } from './commons/Loading'
import { useStateProvider } from '../state/StateProvider'

export const StatusContainer = () => {
  const { home, foreign } = useStateProvider()
  const history = useHistory()
  const { chainId, txHash, messageIdParam } = useParams()
  const validChainId = chainId === home.chainId.toString() || chainId === foreign.chainId.toString()
  const validParameters = validChainId && validTxHash(txHash)

  const { messagesId, status, description, timestamp, loading } = useTransactionStatus({
    txHash: validParameters ? txHash : '',
    chainId: validParameters ? parseInt(chainId) : 0
  })

  const selectedMessageId =
    messageIdParam === undefined || messagesId[messageIdParam] === undefined ? -1 : messageIdParam

  if (!validParameters) {
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
  const displayReference = multiMessageSelected ? messagesId[selectedMessageId] : txHash
  const formattedMessageId = formatTxHash(displayReference)

  const displayedDescription = multiMessageSelected
    ? getTransactionStatusDescription(TRANSACTION_STATUS.SUCCESS_ONE_MESSAGE, timestamp)
    : description

  return (
    <div>
      {status && (
        <p>
          The request <i>{formattedMessageId}</i> {displayedDescription}
        </p>
      )}
      {displayMessageSelector && <MessageSelector messages={messagesId} onMessageSelected={onMessageSelected} />}
    </div>
  )
}
