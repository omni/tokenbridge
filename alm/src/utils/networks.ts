import { formatDistance } from 'date-fns'
import {
  CONFIRMATIONS_STATUS_DESCRIPTION,
  CONFIRMATIONS_STATUS_DESCRIPTION_HOME,
  TRANSACTION_STATUS_DESCRIPTION
} from '../config/descriptions'
import { FOREIGN_EXPLORER_TX_TEMPLATE, HOME_EXPLORER_TX_TEMPLATE } from '../config/constants'

export const validTxHash = (txHash: string) => /^0x[a-fA-F0-9]{64}$/.test(txHash)

export const formatTxHash = (txHash: string) => `${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}`

export const getExplorerTxUrl = (txHash: string, isHome: boolean) => {
  const template = isHome ? HOME_EXPLORER_TX_TEMPLATE : FOREIGN_EXPLORER_TX_TEMPLATE
  return template.replace('%s', txHash)
}

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

export const getConfirmationsStatusDescription = (status: string, home: string, foreign: string, fromHome: boolean) => {
  const statusDescription = fromHome ? CONFIRMATIONS_STATUS_DESCRIPTION_HOME : CONFIRMATIONS_STATUS_DESCRIPTION

  return statusDescription[status]
}
