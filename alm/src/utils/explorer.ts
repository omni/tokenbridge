import {
  EXECUTE_AFFIRMATION_HASH,
  EXECUTE_SIGNATURES_HASH,
  FOREIGN_EXPLORER_API,
  HOME_EXPLORER_API,
  SUBMIT_SIGNATURE_HASH
} from '../config/constants'

export interface APITransaction {
  timeStamp: string
  isError: string
  input: string
  to: string
  hash: string
}

export interface AccountTransactionsParams {
  account: string
  to: string
  startTimestamp: number
  endTimestamp: number
  api: string
}

export interface GetFailedTransactionParams {
  account: string
  to: string
  messageData: string
  startTimestamp: number
  endTimestamp: number
}

export const fetchAccountTransactionsFromBlockscout = async ({
  account,
  to,
  startTimestamp,
  endTimestamp,
  api
}: AccountTransactionsParams): Promise<APITransaction[]> => {
  const url = `${api}?module=account&action=txlist&address=${account}&filterby=from=${account}&to=${to}&starttimestamp=${startTimestamp}&endtimestamp=${endTimestamp}`

  try {
    const result = await fetch(url).then(res => res.json())
    console.log(result)
    if (result.status === '0') {
      return []
    }

    return result.result
  } catch (e) {
    console.log(e)
    return []
  }
}

export const getBlockByTimestampUrl = (api: string, timestamp: number) =>
  `${api}?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=before`

export const fetchAccountTransactionsFromEtherscan = async ({
  account,
  to,
  startTimestamp,
  endTimestamp,
  api
}: AccountTransactionsParams): Promise<APITransaction[]> => {
  const startBlockUrl = getBlockByTimestampUrl(api, startTimestamp)
  const endBlockUrl = getBlockByTimestampUrl(api, endTimestamp)
  let fromBlock = 0
  let toBlock = 9999999999999
  try {
    const [fromBlockResult, toBlockResult] = await Promise.all([
      fetch(startBlockUrl).then(res => res.json()),
      fetch(endBlockUrl).then(res => res.json())
    ])

    if (fromBlockResult.status !== '0') {
      fromBlock = parseInt(fromBlockResult.result)
    }

    if (toBlockResult.status !== '0') {
      toBlock = parseInt(toBlockResult.result)
    }
  } catch (e) {
    console.log(e)
    return []
  }

  const url = `${api}?module=account&action=txlist&address=${account}&startblock=${fromBlock}&endblock=${toBlock}`

  try {
    const result = await fetch(url).then(res => res.json())
    console.log(result)

    if (result.status === '0') {
      return []
    }

    const toAddressLowerCase = to.toLowerCase()
    const transactions: APITransaction[] = result.result
    return transactions.filter(t => t.to.toLowerCase() === toAddressLowerCase)
  } catch (e) {
    console.log(e)
    return []
  }
}

export const fetchAccountTransactions = (api: string) => {
  return api.includes('blockscout') ? fetchAccountTransactionsFromBlockscout : fetchAccountTransactionsFromEtherscan
}

export const getFailedTransactions = async (
  account: string,
  to: string,
  startTimestamp: number,
  endTimestamp: number,
  api: string,
  fetchAccountTransactions: (args: AccountTransactionsParams) => Promise<APITransaction[]>
): Promise<APITransaction[]> => {
  const transactions = await fetchAccountTransactions({ account, to, startTimestamp, endTimestamp, api })

  return transactions.filter(t => t.isError !== '0')
}

export const getValidatorFailedTransactionsForMessage = async ({
  account,
  to,
  messageData,
  startTimestamp,
  endTimestamp
}: GetFailedTransactionParams): Promise<APITransaction[]> => {
  const failedTransactions = await getFailedTransactions(
    account,
    to,
    startTimestamp,
    endTimestamp,
    HOME_EXPLORER_API,
    fetchAccountTransactionsFromBlockscout
  )

  const messageDataValue = messageData.replace('0x', '')
  return failedTransactions.filter(
    t =>
      (t.input.includes(SUBMIT_SIGNATURE_HASH) || t.input.includes(EXECUTE_AFFIRMATION_HASH)) &&
      t.input.includes(messageDataValue)
  )
}

export const getExecutionFailedTransactionForMessage = async ({
  account,
  to,
  messageData,
  startTimestamp,
  endTimestamp
}: GetFailedTransactionParams): Promise<APITransaction[]> => {
  const failedTransactions = await getFailedTransactions(
    account,
    to,
    startTimestamp,
    endTimestamp,
    FOREIGN_EXPLORER_API,
    fetchAccountTransactions(FOREIGN_EXPLORER_API)
  )

  const messageDataValue = messageData.replace('0x', '')
  return failedTransactions.filter(t => t.input.includes(EXECUTE_SIGNATURES_HASH) && t.input.includes(messageDataValue))
}
