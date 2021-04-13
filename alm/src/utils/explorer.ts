import {
  BLOCK_RANGE,
  EXECUTE_AFFIRMATION_HASH,
  EXECUTE_SIGNATURES_HASH,
  FOREIGN_EXPLORER_API,
  HOME_EXPLORER_API,
  MAX_TX_SEARCH_BLOCK_RANGE,
  SUBMIT_SIGNATURE_HASH
} from '../config/constants'
import { AbiItem } from 'web3-utils'
import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'

export interface APITransaction {
  timeStamp: string
  isError: string
  input: string
  to: string
  hash: string
  blockNumber: string
}

export interface APIPendingTransaction {
  input: string
  to: string
  hash: string
}

export interface PendingTransactionsParams {
  account: string
  api: string
}

export interface AccountTransactionsParams {
  account: string
  startBlock: number
  endBlock: number
  api: string
}

export interface GetPendingTransactionParams {
  account: string
  to: string
  messageData: string
}

export interface GetTransactionParams extends GetPendingTransactionParams {
  startBlock: number
  endBlock: number
}

export const fetchAccountTransactions = async ({ account, startBlock, endBlock, api }: AccountTransactionsParams) => {
  const url = new URL(api)
  url.searchParams.append('module', 'account')
  url.searchParams.append('action', 'txlist')
  url.searchParams.append('address', account)
  url.searchParams.append('filterby', 'from')
  url.searchParams.append('startblock', startBlock.toString())
  url.searchParams.append('endblock', endBlock.toString())

  const result = await fetch(url.toString()).then(res => res.json())

  if (result.message === 'No transactions found') {
    return []
  }

  return result.result
}

export const fetchPendingTransactions = async ({
  account,
  api
}: PendingTransactionsParams): Promise<APIPendingTransaction[]> => {
  if (!api.includes('blockscout')) {
    return []
  }
  const url = new URL(api)
  url.searchParams.append('module', 'account')
  url.searchParams.append('action', 'pendingtxlist')
  url.searchParams.append('address', account)

  try {
    const result = await fetch(url.toString()).then(res => res.json())
    if (result.status === '0') {
      return []
    }

    return result.result
  } catch (e) {
    return []
  }
}

export const getClosestBlockByTimestamp = async (api: string, timestamp: number): Promise<number> => {
  if (api.includes('blockscout')) {
    throw new Error('Blockscout does not support getblocknobytime')
  }

  const url = new URL(api)
  url.searchParams.append('module', 'block')
  url.searchParams.append('action', 'getblocknobytime')
  url.searchParams.append('timestamp', timestamp.toString())
  url.searchParams.append('closest', 'before')

  const blockNumber = await fetch(url.toString()).then(res => res.json())

  return parseInt(blockNumber.result)
}

// fast version of fetchAccountTransactions
// sequentially fetches transactions in small batches
// caches the result
const transactionsCache: { [key: string]: { lastBlock: number; transactions: APITransaction[] } } = {}
export const getAccountTransactions = async ({
  account,
  startBlock,
  endBlock,
  api
}: AccountTransactionsParams): Promise<APITransaction[]> => {
  const key = `${account}-${startBlock}-${api}`

  // initialize empty cache if it doesn't exist yet
  if (!transactionsCache[key]) {
    transactionsCache[key] = { lastBlock: startBlock - 1, transactions: [] }
  }

  // if cache contains events up to block X,
  // new batch is fetched for range [X + 1, X + 1 + BLOCK_RANGE]
  const newStartBlock = transactionsCache[key].lastBlock + 1
  const newEndBlock = newStartBlock + BLOCK_RANGE

  // search for new transactions only if max allowed block range is not yet exceeded
  if (newEndBlock <= startBlock + MAX_TX_SEARCH_BLOCK_RANGE) {
    const newTransactions = await fetchAccountTransactions({
      account,
      startBlock: newStartBlock,
      endBlock: newEndBlock,
      api
    })

    const transactions = transactionsCache[key].transactions.concat(...newTransactions)

    // cache updated transactions list
    transactionsCache[key].transactions = transactions

    // enbBlock is assumed to be the current block number of the chain
    // if the whole range is finalized, last block can be safely updated to the end of the range
    // this works even if there are no transactions in the list
    if (newEndBlock < endBlock) {
      transactionsCache[key].lastBlock = newEndBlock
    } else if (transactions.length > 0) {
      transactionsCache[key].lastBlock = parseInt(transactions[transactions.length - 1].blockNumber, 10)
    }

    return transactions
  }

  console.warn(`Reached max transaction searching range, returning previously cached transactions for ${account}`)
  return transactionsCache[key].transactions
}

export const getLogs = async (
  api: string,
  web3: Web3,
  contract: Contract,
  event: string,
  options: { fromBlock: number; toBlock: number | 'latest'; topics: (string | null)[] }
) => {
  const abi = contract.options.jsonInterface.find((abi: AbiItem) => abi.type === 'event' && abi.name === event)!

  const url = new URL(api)
  url.searchParams.append('module', 'logs')
  url.searchParams.append('action', 'getLogs')
  url.searchParams.append('address', contract.options.address)
  url.searchParams.append('fromBlock', options.fromBlock.toString())
  url.searchParams.append('toBlock', (options.toBlock || 'latest').toString())

  const topics = [web3.eth.abi.encodeEventSignature(abi), ...(options.topics || [])]
  for (let i = 0; i < topics.length; i++) {
    if (topics[i] !== null) {
      url.searchParams.append(`topic${i}`, topics[i] as string)
      for (let j = 0; j < i; j++) {
        url.searchParams.append(`topic${j}_${i}_opr`, 'and')
      }
    }
  }

  const logs = await fetch(url.toString()).then(res => res.json())

  return logs.result.map((log: any) => ({
    transactionHash: log.transactionHash,
    blockNumber: parseInt(log.blockNumber.slice(2), 16),
    returnValues: web3.eth.abi.decodeLog(abi.inputs!, log.data, log.topics.slice(1))
  }))
}

const filterReceiver = (to: string) => (tx: APITransaction) => tx.to.toLowerCase() === to.toLowerCase()

export const getFailedTransactions = async (
  account: string,
  to: string,
  startBlock: number,
  endBlock: number,
  api: string,
  getAccountTransactionsMethod = getAccountTransactions
): Promise<APITransaction[]> => {
  const transactions = await getAccountTransactionsMethod({ account, startBlock, endBlock, api })

  return transactions.filter(t => t.isError !== '0').filter(filterReceiver(to))
}

export const getSuccessTransactions = async (
  account: string,
  to: string,
  startBlock: number,
  endBlock: number,
  api: string,
  getAccountTransactionsMethod = getAccountTransactions
): Promise<APITransaction[]> => {
  const transactions = await getAccountTransactionsMethod({ account, startBlock, endBlock, api })

  return transactions.filter(t => t.isError === '0').filter(filterReceiver(to))
}

export const filterValidatorSignatureTransaction = (
  transactions: APITransaction[],
  messageData: string
): APITransaction[] => {
  const messageDataValue = messageData.replace('0x', '')
  return transactions.filter(
    t =>
      (t.input.includes(SUBMIT_SIGNATURE_HASH) || t.input.includes(EXECUTE_AFFIRMATION_HASH)) &&
      t.input.includes(messageDataValue)
  )
}

export const getValidatorFailedTransactionsForMessage = async ({
  account,
  to,
  messageData,
  startBlock,
  endBlock
}: GetTransactionParams): Promise<APITransaction[]> => {
  const failedTransactions = await getFailedTransactions(account, to, startBlock, endBlock, HOME_EXPLORER_API)

  return filterValidatorSignatureTransaction(failedTransactions, messageData)
}

export const getValidatorSuccessTransactionsForMessage = async ({
  account,
  to,
  messageData,
  startBlock,
  endBlock
}: GetTransactionParams): Promise<APITransaction[]> => {
  const transactions = await getSuccessTransactions(account, to, startBlock, endBlock, HOME_EXPLORER_API)

  return filterValidatorSignatureTransaction(transactions, messageData)
}

export const getExecutionFailedTransactionForMessage = async (
  { account, to, messageData, startBlock, endBlock }: GetTransactionParams,
  getFailedTransactionsMethod = getFailedTransactions
): Promise<APITransaction[]> => {
  const failedTransactions = await getFailedTransactionsMethod(account, to, startBlock, endBlock, FOREIGN_EXPLORER_API)

  const messageDataValue = messageData.replace('0x', '')
  return failedTransactions.filter(t => t.input.includes(EXECUTE_SIGNATURES_HASH) && t.input.includes(messageDataValue))
}

export const getValidatorPendingTransactionsForMessage = async (
  { account, to, messageData }: GetPendingTransactionParams,
  fetchPendingTransactionsMethod = fetchPendingTransactions
): Promise<APIPendingTransaction[]> => {
  const pendingTransactions = await fetchPendingTransactionsMethod({
    account,
    api: HOME_EXPLORER_API
  })

  const toAddressLowerCase = to.toLowerCase()
  const messageDataValue = messageData.replace('0x', '')

  return pendingTransactions.filter(
    t =>
      t.to.toLowerCase() === toAddressLowerCase &&
      (t.input.includes(SUBMIT_SIGNATURE_HASH) || t.input.includes(EXECUTE_AFFIRMATION_HASH)) &&
      t.input.includes(messageDataValue)
  )
}

export const getExecutionPendingTransactionsForMessage = async (
  { account, to, messageData }: GetPendingTransactionParams,
  fetchPendingTransactionsMethod = fetchPendingTransactions
): Promise<APIPendingTransaction[]> => {
  const pendingTransactions = await fetchPendingTransactionsMethod({
    account,
    api: FOREIGN_EXPLORER_API
  })

  const toAddressLowerCase = to.toLowerCase()
  const messageDataValue = messageData.replace('0x', '')

  return pendingTransactions.filter(
    t =>
      t.to.toLowerCase() === toAddressLowerCase &&
      t.input.includes(EXECUTE_SIGNATURES_HASH) &&
      t.input.includes(messageDataValue)
  )
}
