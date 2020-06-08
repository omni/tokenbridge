import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTransactionStatus } from '../hooks/useTransactionStatus'
import { formatTxHash, getTransactionStatusDescription, validChainId, validTxHash } from '../utils/networks'
import { TRANSACTION_STATUS } from '../config/constants'
import { MessageSelector } from './MessageSelector'

export const StatusContainer = () => {
  const [selectedMessageId, setSelectedMessageId] = useState(-1)

  const { chainId, txHash } = useParams()

  const validParameters = validChainId(chainId) && validTxHash(txHash)

  const { messagesId, status, description, timestamp } = useTransactionStatus({
    txHash: validParameters ? txHash : '',
    chainId: validParameters ? parseInt(chainId) : 0
  })

  if (!validParameters) {
    return (
      <div>
        <p>
          Chain Id: {chainId} and/or Transaction Hash: {txHash} are not valid
        </p>
      </div>
    )
  }

  const onMessageSelected = (messageId: number) => {
    setSelectedMessageId(messageId)
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
