import { VALIDATOR_CONFIRMATION_STATUS } from '../config/constants'
import { BlockNumberProvider } from '../services/BlockNumberProvider'

export const checkSignaturesWaitingForBLocks = async (
  targetBlock: number,
  setWaitingStatus: Function,
  setWaitingBlocksResolved: Function,
  validatorList: string[],
  setConfirmations: Function,
  blockProvider: BlockNumberProvider,
  interval: number,
  subscriptions: number[]
) => {
  const currentBlock = blockProvider.get()

  if (currentBlock && currentBlock >= targetBlock) {
    setWaitingStatus(false)
    setWaitingBlocksResolved(true)
    blockProvider.stop()
  } else {
    let nextInterval = interval
    if (!currentBlock) {
      nextInterval = 500
    } else {
      const validatorsWaiting = validatorList.map(validator => {
        return {
          validator,
          status: VALIDATOR_CONFIRMATION_STATUS.WAITING
        }
      })
      setWaitingStatus(true)
      setConfirmations(validatorsWaiting)
    }
    const timeoutId = setTimeout(
      () =>
        checkSignaturesWaitingForBLocks(
          targetBlock,
          setWaitingStatus,
          setWaitingBlocksResolved,
          validatorList,
          setConfirmations,
          blockProvider,
          interval,
          subscriptions
        ),
      nextInterval
    )
    subscriptions.push(timeoutId)
  }
}
