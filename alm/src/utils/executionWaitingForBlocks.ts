import { BlockNumberProvider } from '../services/BlockNumberProvider'
import { VALIDATOR_CONFIRMATION_STATUS } from '../config/constants'
import { EventData } from 'web3-eth-contract'

export const checkWaitingBlocksForExecution = async (
  blockProvider: BlockNumberProvider,
  interval: number,
  targetBlock: number,
  collectedSignaturesEvent: EventData,
  setWaitingBlocksForExecution: Function,
  setWaitingBlocksForExecutionResolved: Function,
  setExecutionData: Function,
  subscriptions: number[]
) => {
  const currentBlock = blockProvider.get()

  if (currentBlock && currentBlock >= targetBlock) {
    const undefinedExecutionState = {
      status: VALIDATOR_CONFIRMATION_STATUS.UNDEFINED,
      validator: collectedSignaturesEvent.returnValues.authorityResponsibleForRelay,
      txHash: '',
      timestamp: 0,
      executionResult: false
    }
    setExecutionData(
      (data: any) =>
        data.status === VALIDATOR_CONFIRMATION_STATUS.UNDEFINED || data.status === VALIDATOR_CONFIRMATION_STATUS.WAITING
          ? undefinedExecutionState
          : data
    )
    setWaitingBlocksForExecutionResolved(true)
    setWaitingBlocksForExecution(false)
    blockProvider.stop()
  } else {
    let nextInterval = interval
    if (!currentBlock) {
      nextInterval = 500
    } else {
      setWaitingBlocksForExecution(true)
      const waitingExecutionState = {
        status: VALIDATOR_CONFIRMATION_STATUS.WAITING,
        validator: collectedSignaturesEvent.returnValues.authorityResponsibleForRelay,
        txHash: '',
        timestamp: 0,
        executionResult: false
      }
      setExecutionData(
        (data: any) =>
          data.status === VALIDATOR_CONFIRMATION_STATUS.UNDEFINED ||
          data.status === VALIDATOR_CONFIRMATION_STATUS.WAITING
            ? waitingExecutionState
            : data
      )
    }
    const timeoutId = setTimeout(
      () =>
        checkWaitingBlocksForExecution(
          blockProvider,
          interval,
          targetBlock,
          collectedSignaturesEvent,
          setWaitingBlocksForExecution,
          setWaitingBlocksForExecutionResolved,
          setExecutionData,
          subscriptions
        ),
      nextInterval
    )
    subscriptions.push(timeoutId)
  }
}
