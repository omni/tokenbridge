import { Contract, EventData } from 'web3-eth-contract'
import Web3 from 'web3'
import { THREE_DAYS_TIMESTAMP, VALIDATOR_CONFIRMATION_STATUS } from '../config/constants'
import { ExecutionData } from '../hooks/useMessageConfirmations'
import { APITransaction, GetFailedTransactionParams } from './explorer'
import { MessageObject } from './web3'

export const getFinalizationEvent = async (
  contract: Maybe<Contract>,
  eventName: string,
  web3: Maybe<Web3>,
  setResult: React.Dispatch<React.SetStateAction<ExecutionData>>,
  waitingBlocksResolved: boolean,
  message: MessageObject,
  interval: number,
  subscriptions: number[],
  timestamp: number,
  collectedSignaturesEvent: Maybe<EventData>,
  getFailedExecution: (args: GetFailedTransactionParams) => Promise<APITransaction[]>,
  setFailedExecution: Function
) => {
  if (!contract || !web3 || !waitingBlocksResolved) return
  // Since it filters by the message id, only one event will be fetched
  // so there is no need to limit the range of the block to reduce the network traffic
  const events: EventData[] = await contract.getPastEvents(eventName, {
    fromBlock: 0,
    toBlock: 'latest',
    filter: {
      messageId: message.id
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
    // If event is defined, it means it is a message from Home to Foreign
    if (collectedSignaturesEvent) {
      const failedTransactions = await getFailedExecution({
        account: collectedSignaturesEvent.returnValues.authorityResponsibleForRelay,
        to: contract.options.address,
        messageData: message.data,
        startTimestamp: timestamp,
        endTimestamp: timestamp + THREE_DAYS_TIMESTAMP
      })

      if (failedTransactions.length > 0) {
        const failedTx = failedTransactions[0]
        setResult({
          status: VALIDATOR_CONFIRMATION_STATUS.FAILED,
          validator: collectedSignaturesEvent.returnValues.authorityResponsibleForRelay,
          txHash: failedTx.hash,
          timestamp: parseInt(failedTx.timeStamp),
          executionResult: false
        })
        setFailedExecution(true)
      }
    }

    const timeoutId = setTimeout(
      () =>
        getFinalizationEvent(
          contract,
          eventName,
          web3,
          setResult,
          waitingBlocksResolved,
          message,
          interval,
          subscriptions,
          timestamp,
          collectedSignaturesEvent,
          getFailedExecution,
          setFailedExecution
        ),
      interval
    )
    subscriptions.push(timeoutId)
  }
}
