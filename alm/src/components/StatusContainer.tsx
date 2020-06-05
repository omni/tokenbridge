import React from 'react'
import { useParams } from 'react-router-dom'
import { useTransactionStatus } from '../hooks/useTransactionStatus'
import { formatTxHash, validChainId, validTxHash } from '../utils/networks'

export const StatusContainer = () => {
  const { chainId, txHash } = useParams()

  const validParameters = validChainId(chainId) && validTxHash(txHash)

  const { status, description } = useTransactionStatus({
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

  const formattedMessageId = formatTxHash(txHash)

  return (
    <div>
      {status && (
        <p>
          The request <i>{formattedMessageId}</i> {description}
        </p>
      )}
    </div>
  )
}
