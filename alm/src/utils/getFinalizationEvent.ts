import { Contract, EventData } from 'web3-eth-contract'
import Web3 from 'web3'
import { VALIDATOR_CONFIRMATION_STATUS } from '../config/constants'
import { ExecutionData } from '../hooks/useMessageConfirmations'

export const getFinalizationEvent = async (
  contract: Maybe<Contract>,
  eventName: string,
  web3: Maybe<Web3>,
  setResult: React.Dispatch<React.SetStateAction<ExecutionData>>,
  waitingBlocksResolved: boolean,
  messageId: string,
  interval: number,
  subscriptions: number[]
) => {
  if (!contract || !web3 || !waitingBlocksResolved) return
  // Since it filters by the message id, only one event will be fetched
  // so there is no need to limit the range of the block to reduce the network traffic
  const events: EventData[] = await contract.getPastEvents(eventName, {
    fromBlock: 0,
    toBlock: 'latest',
    filter: {
      messageId
    }
  })
  if (events.length > 0) {
    const event = events[0]
    const [txReceipt, block] = await Promise.all([
      web3.eth.getTransactionReceipt(event.transactionHash),
      web3.eth.getBlock(event.blockNumber)
    ])

    const blockTimestamp = typeof block.timestamp === 'string' ? parseInt(block.timestamp) : block.timestamp
    const validatorAddress = web3.utils.toChecksumAddress(txReceipt.from)

    setResult({
      status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS,
      validator: validatorAddress,
      txHash: event.transactionHash,
      timestamp: blockTimestamp,
      executionResult: event.returnValues.status
    })
  } else {
    const timeoutId = setTimeout(
      () =>
        getFinalizationEvent(
          contract,
          eventName,
          web3,
          setResult,
          waitingBlocksResolved,
          messageId,
          interval,
          subscriptions
        ),
      interval
    )
    subscriptions.push(timeoutId)
  }
}
