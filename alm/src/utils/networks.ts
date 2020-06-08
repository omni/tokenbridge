import { formatDistance } from 'date-fns'
import { TRANSACTION_STATUS_DESCRIPTION } from '../config/descriptions'

export const validTxHash = (txHash: string) => /^0x[a-fA-F0-9]{64}$/.test(txHash)

export const formatTxHash = (txHash: string) => `${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}`

export const formatTxHashExtended = (txHash: string) =>
  `${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 8)}`

export const formatTimestamp = (timestamp: number): string => {
  const txDate = new Date(0).setUTCSeconds(timestamp)
  return formatDistance(txDate, new Date(), {
    addSuffix: true
  })
}

export const getTransactionStatusDescription = (status: string, timestamp: Maybe<number> = null) => {
  let description = TRANSACTION_STATUS_DESCRIPTION[status]

  if (timestamp) {
    description = description.replace('%t', formatTimestamp(timestamp))
  }

  return description
}
