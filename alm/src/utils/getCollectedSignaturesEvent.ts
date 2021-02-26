import Web3 from 'web3'
import { Contract, EventData } from 'web3-eth-contract'
import { homeBlockNumberProvider } from '../services/BlockNumberProvider'
import { BLOCK_RANGE } from '../config/constants'

export const getCollectedSignaturesEvent = async (
  web3: Maybe<Web3>,
  contract: Maybe<Contract>,
  fromBlock: number,
  toBlock: number,
  messageHash: string,
  setCollectedSignaturesEvent: Function,
  subscriptions: number[]
) => {
  if (!web3 || !contract) return
  const currentBlock = homeBlockNumberProvider.get()

  let events: EventData[] = []
  let securedToBlock = toBlock
  if (currentBlock) {
    // prevent errors if the toBlock parameter is bigger than the latest
    securedToBlock = toBlock >= currentBlock ? currentBlock : toBlock
    events = await contract.getPastEvents('CollectedSignatures', {
      fromBlock,
      toBlock: securedToBlock
    })
  }

  const filteredEvents = events.filter(e => e.returnValues.messageHash === messageHash)

  if (filteredEvents.length) {
    const event = filteredEvents[0]
    setCollectedSignaturesEvent(event)
  } else {
    const newFromBlock = currentBlock ? securedToBlock : fromBlock
    const newToBlock = currentBlock ? toBlock + BLOCK_RANGE : toBlock
    const timeoutId = setTimeout(
      () =>
        getCollectedSignaturesEvent(
          web3,
          contract,
          newFromBlock,
          newToBlock,
          messageHash,
          setCollectedSignaturesEvent,
          subscriptions
        ),
      500
    )
    subscriptions.push(timeoutId)
  }
}
