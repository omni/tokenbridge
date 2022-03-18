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
  sender?: string
  executor?: string
  obToken?: string
  obReceiver?: string
}

export interface WarnRule {
  message: string
  sender?: string
  executor?: string
  obToken?: string
  obReceiver?: string
}

export const matchesRule = (rule: WarnRule, msg: MessageObject) => {
  if (!msg.executor || !msg.sender) {
    return false
  }
  if (!!rule.executor && rule.executor.toLowerCase() !== msg.executor.toLowerCase()) {
    return false
  }
  if (!!rule.sender && rule.sender.toLowerCase() !== msg.sender.toLowerCase()) {
    return false
  }
  if (!!rule.obToken && (!msg.obToken || rule.obToken.toLowerCase() !== msg.obToken.toLowerCase())) {
    return false
  }
  if (!!rule.obReceiver && (!msg.obReceiver || rule.obReceiver.toLowerCase() !== msg.obReceiver.toLowerCase())) {
    return false
  }
  return true
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

  if (!eventAbi || !eventAbi.inputs || !eventAbi.inputs.length) {
    return []
  }
  const inputs = eventAbi.inputs
  return events.map(e => {
    const { messageId, encodedData } = web3.eth.abi.decodeLog(inputs, e.data, [e.topics[1]])
    let sender, executor, obToken, obReceiver
    if (encodedData.length >= 160) {
      sender = `0x${encodedData.slice(66, 106)}`
      executor = `0x${encodedData.slice(106, 146)}`
      const dataOffset =
        160 + (parseInt(encodedData.slice(154, 156), 16) + parseInt(encodedData.slice(156, 158), 16)) * 2 + 8
      if (encodedData.length >= dataOffset + 64) {
        obToken = `0x${encodedData.slice(dataOffset + 24, dataOffset + 64)}`
      }
      if (encodedData.length >= dataOffset + 128) {
        obReceiver = `0x${encodedData.slice(dataOffset + 88, dataOffset + 128)}`
      }
    }
    return {
      id: messageId || '',
      data: encodedData || '',
      sender,
      executor,
      obToken,
      obReceiver
    }
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
