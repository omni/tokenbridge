import Web3 from 'web3'
import { BlockTransactionString } from 'web3-eth'
import { TransactionReceipt } from 'web3-eth'
import { AbiItem } from 'web3-utils'
import memoize from 'fast-memoize'
import promiseRetry from 'promise-retry'
import { HOME_AMB_ABI, FOREIGN_AMB_ABI } from '../abis'
import { SnapshotProvider } from '../services/SnapshotProvider'

export interface MessageObject {
  id: string
  data: string
}

const rawGetWeb3 = (url: string) => new Web3(new Web3.providers.HttpProvider(url))
const memoized = memoize(rawGetWeb3)

export const getWeb3 = (url: string) => memoized(url)

export const filterEventsByAbi = (
  txReceipt: TransactionReceipt,
  web3: Web3,
  bridgeAddress: string,
  eventAbi: AbiItem
): MessageObject[] => {
  const eventHash = web3.eth.abi.encodeEventSignature(eventAbi)
  const events = txReceipt.logs.filter(e => e.address === bridgeAddress && e.topics[0] === eventHash)

  return events.map(e => {
    let decodedLogs: { [p: string]: string } = {
      messageId: '',
      encodedData: ''
    }
    if (eventAbi && eventAbi.inputs && eventAbi.inputs.length) {
      decodedLogs = web3.eth.abi.decodeLog(eventAbi.inputs, e.data, [e.topics[1]])
    }
    return { id: decodedLogs.messageId, data: decodedLogs.encodedData }
  })
}

export const getHomeMessagesFromReceipt = (txReceipt: TransactionReceipt, web3: Web3, bridgeAddress: string) => {
  const UserRequestForSignatureAbi: AbiItem = HOME_AMB_ABI.filter(
    (e: AbiItem) => e.type === 'event' && e.name === 'UserRequestForSignature'
  )[0]
  return filterEventsByAbi(txReceipt, web3, bridgeAddress, UserRequestForSignatureAbi)
}

export const getForeignMessagesFromReceipt = (txReceipt: TransactionReceipt, web3: Web3, bridgeAddress: string) => {
  const userRequestForAffirmationAbi: AbiItem = FOREIGN_AMB_ABI.filter(
    (e: AbiItem) => e.type === 'event' && e.name === 'UserRequestForAffirmation'
  )[0]
  return filterEventsByAbi(txReceipt, web3, bridgeAddress, userRequestForAffirmationAbi)
}

// In some rare cases the block data is not available yet for the block of a new event detected
// so this logic retry to get the block in case it fails
export const getBlock = async (web3: Web3, blockNumber: number): Promise<BlockTransactionString> =>
  promiseRetry(async retry => {
    const result = await web3.eth.getBlock(blockNumber)
    if (!result) {
      return retry('Error getting block data')
    }
    return result
  })

export const getChainId = async (web3: Web3, snapshotProvider: SnapshotProvider) => {
  let id = snapshotProvider.chainId()
  if (id === 0) {
    id = await web3.eth.getChainId()
  }
  return id
}
