import { EXECUTE_AFFIRMATION_HASH, HOME_EXPLORER_API, SUBMIT_SIGNATURE_HASH } from '../config/constants'

export interface APITransaction {
  isError: string
  input: string
}

export interface AccountTransactionsParams {
  account: string
  to: string
  startTimestamp?: Maybe<number>
  endTimestamp?: Maybe<number>
  api: string
}

export interface GetFailedTransactionParams {
  account: string
  to: string
  messageData: string
  startTimestamp: Maybe<number>
  endTimestamp: Maybe<number>
}

export const fetchAccountTransactions = async ({
  account,
  to,
  startTimestamp,
  endTimestamp,
  api
}: AccountTransactionsParams): Promise<APITransaction[]> => {
  let url = `${api}?module=account&action=txlist&address=${account}&filterby=from=${account}&to=${to}`
  if (startTimestamp && endTimestamp) {
    url = `${url}&starttimestamp=${startTimestamp}&endtimestamp=${endTimestamp}`
  }
  try {
    const result = await fetch(url).then(res => res.json())
    console.log(result.result)
    return result.result
  } catch (e) {
    console.log(e)
    return []
  }
}

export const getFailedTransactions = async (
  account: string,
  to: string,
  startTimestamp: Maybe<number>,
  endTimestamp: Maybe<number>,
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
    fetchAccountTransactions
  )

  const messageDataValue = messageData.replace('0x', '')
  return failedTransactions.filter(
    t =>
      (t.input.includes(SUBMIT_SIGNATURE_HASH) || t.input.includes(EXECUTE_AFFIRMATION_HASH)) &&
      t.input.includes(messageDataValue)
  )
}
