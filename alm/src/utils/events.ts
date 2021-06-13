import { Contract } from 'web3-eth-contract'
import { HOME_SUBGRAPH_URL, FOREIGN_SUBGRAPH_URL } from '../config/constants'
import { gqlQuery } from './subgraph'

export const getEvents = async (
  contract: Contract,
  eventName: string,
  fromBlock: number,
  isHome: boolean,
  toBlock?: number,
  filter: any = {}
) => {
  const subgraphURI = isHome ? HOME_SUBGRAPH_URL : FOREIGN_SUBGRAPH_URL
  if (subgraphURI === '') {
    return await contract.getPastEvents(eventName, {
      fromBlock,
      toBlock,
      filter
    })
  } else {
    let res = await gqlQuery(subgraphURI, eventName, filter, toBlock)
    return res
  }
}
