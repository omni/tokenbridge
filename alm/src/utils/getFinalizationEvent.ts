import { Contract, EventData } from 'web3-eth-contract'
import Web3 from 'web3'
import { CACHE_KEY_EXECUTION_FAILED, THREE_DAYS_TIMESTAMP, VALIDATOR_CONFIRMATION_STATUS } from '../config/constants'
import { ExecutionData } from '../hooks/useMessageConfirmations'
import {
  APIPendingTransaction,
  APITransaction,
  GetFailedTransactionParams,
  GetPendingTransactionParams
} from './explorer'
import { getBlock, MessageObject } from './web3'
import validatorsCache from '../services/ValidatorsCache'

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
  setFailedExecution: Function,
  getPendingExecution: (args: GetPendingTransactionParams) => Promise<APIPendingTransaction[]>,
  setPendingExecution: Function,
  setExecutionEventsFetched: Function
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
      getBlock(web3, event.blockNumber)
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
    setExecutionEventsFetched(true)
    // If event is defined, it means it is a message from Home to Foreign
    if (collectedSignaturesEvent) {
      const validator = collectedSignaturesEvent.returnValues.authorityResponsibleForRelay

      const pendingTransactions = await getPendingExecution({
        account: validator,
        messageData: message.data,
        to: contract.options.address
      })

      // If the transaction is pending it sets the status and avoid making the request for failed transactions
      if (pendingTransactions.length > 0) {
        const pendingTx = pendingTransactions[0]

        const nowTimestamp = Math.floor(new Date().getTime() / 1000.0)

        setResult({
          status: VALIDATOR_CONFIRMATION_STATUS.PENDING,
          validator: validator,
          txHash: pendingTx.hash,
          timestamp: nowTimestamp,
          executionResult: false
        })
        setPendingExecution(true)
      } else {
        const validatorExecutionCacheKey = `${CACHE_KEY_EXECUTION_FAILED}${validator}-${message.id}`
        const failedFromCache = validatorsCache.get(validatorExecutionCacheKey)

        if (!failedFromCache) {
          const failedTransactions = await getFailedExecution({
            account: validator,
            to: contract.options.address,
            messageData: message.data,
            startTimestamp: timestamp,
            endTimestamp: timestamp + THREE_DAYS_TIMESTAMP
          })

          if (failedTransactions.length > 0) {
            const failedTx = failedTransactions[0]

            // If validator execution failed, we cache the result to avoid doing future requests for a result that won't change
            validatorsCache.set(validatorExecutionCacheKey, true)

            const timestamp = parseInt(failedTx.timeStamp)
            setResult({
              status: VALIDATOR_CONFIRMATION_STATUS.FAILED,
              validator: validator,
              txHash: failedTx.hash,
              timestamp,
              executionResult: false
            })
            setFailedExecution(true)
          }
        }
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
          setFailedExecution,
          getPendingExecution,
          setPendingExecution,
          setExecutionEventsFetched
        ),
      interval
    )
    subscriptions.push(timeoutId)
  }
}
