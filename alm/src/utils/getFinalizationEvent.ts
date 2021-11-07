import { Contract, EventData } from 'web3-eth-contract'
import Web3 from 'web3'
import {
  CACHE_KEY_EXECUTION_FAILED,
  FOREIGN_EXPLORER_API,
  FOREIGN_RPC_POLLING_INTERVAL,
  HOME_EXPLORER_API,
  HOME_RPC_POLLING_INTERVAL,
  VALIDATOR_CONFIRMATION_STATUS
} from '../config/constants'
import { ExecutionData } from '../hooks/useMessageConfirmations'
import {
  APIPendingTransaction,
  APITransaction,
  GetTransactionParams,
  GetPendingTransactionParams,
  getLogs
} from './explorer'
import { getBlock, MessageObject } from './web3'
import validatorsCache from '../services/ValidatorsCache'
import { foreignBlockNumberProvider, homeBlockNumberProvider } from '../services/BlockNumberProvider'

const getPastEventsWithFallback = (api: string, web3: Web3, contract: Contract, eventName: string, options: any) =>
  contract.getPastEvents(eventName, options).catch(
    () =>
      api
        ? getLogs(api, web3, contract, eventName, {
            fromBlock: options.fromBlock,
            toBlock: options.toBlock,
            topics: [null, null, options.filter.messageId]
          })
        : []
  )

export const getSuccessExecutionData = async (
  contract: Contract,
  eventName: string,
  web3: Web3,
  messageId: string,
  api: string = ''
) => {
  // Since it filters by the message id, only one event will be fetched
  // so there is no need to limit the range of the block to reduce the network traffic
  const events: EventData[] = await getPastEventsWithFallback(api, web3, contract, eventName, {
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
      getBlock(web3, event.blockNumber)
    ])

    const blockTimestamp = typeof block.timestamp === 'string' ? parseInt(block.timestamp) : block.timestamp
    const validatorAddress = web3.utils.toChecksumAddress(txReceipt.from)

    return {
      status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS,
      validator: validatorAddress,
      txHash: event.transactionHash,
      timestamp: blockTimestamp,
      executionResult: event.returnValues.status
    }
  }
  return null
}

export const getFinalizationEvent = async (
  fromHome: boolean,
  contract: Contract,
  web3: Web3,
  setResult: React.Dispatch<React.SetStateAction<ExecutionData>>,
  message: MessageObject,
  setTimeoutId: (timeoutId: number) => void,
  isCancelled: () => boolean,
  startBlock: number,
  collectedSignaturesEvent: Maybe<EventData>,
  getFailedExecution: (args: GetTransactionParams) => Promise<APITransaction[]>,
  setFailedExecution: Function,
  getPendingExecution: (args: GetPendingTransactionParams) => Promise<APIPendingTransaction[]>,
  setPendingExecution: Function,
  setExecutionEventsFetched: Function
) => {
  const eventName = fromHome ? 'RelayedMessage' : 'AffirmationCompleted'
  const api = fromHome ? FOREIGN_EXPLORER_API : HOME_EXPLORER_API

  const successExecutionData = await getSuccessExecutionData(contract, eventName, web3, message.id, api)

  if (successExecutionData) {
    setResult(successExecutionData)
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
        const blockProvider = fromHome ? foreignBlockNumberProvider : homeBlockNumberProvider

        if (!failedFromCache) {
          const failedTransactions = await getFailedExecution({
            account: validator,
            to: contract.options.address,
            messageData: message.data,
            startBlock,
            endBlock: blockProvider.get() || 0
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

    if (!isCancelled()) {
      const timeoutId = window.setTimeout(
        () =>
          getFinalizationEvent(
            fromHome,
            contract,
            web3,
            setResult,
            message,
            setTimeoutId,
            isCancelled,
            startBlock,
            collectedSignaturesEvent,
            getFailedExecution,
            setFailedExecution,
            getPendingExecution,
            setPendingExecution,
            setExecutionEventsFetched
          ),
        fromHome ? FOREIGN_RPC_POLLING_INTERVAL : HOME_RPC_POLLING_INTERVAL
      )
      setTimeoutId(timeoutId)
    }
  }
}
