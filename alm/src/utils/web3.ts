import Web3 from 'web3'
import { TransactionReceipt } from 'web3-eth'
import { AbiItem } from 'web3-utils'
import memoize from 'fast-memoize'
import { HOME_AMB_ABI, FOREIGN_AMB_ABI } from '../../../commons'

const rawGetWeb3 = (url: string) => new Web3(new Web3.providers.HttpProvider(url))
const memoized = memoize(rawGetWeb3)

export const getWeb3 = (url: string) => memoized(url)

export const filterEventsByAbi = (
  txReceipt: TransactionReceipt,
  web3: Web3,
  bridgeAddress: string,
  eventAbi: AbiItem
) => {
  const eventHash = web3.eth.abi.encodeEventSignature(eventAbi)
  const events = txReceipt.logs.filter(e => e.address === bridgeAddress && e.topics[0] === eventHash)

  return events.map(e => e.topics[1])
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
