import { useStateProvider } from '../state/StateProvider'
import { TransactionReceipt } from 'web3-eth'
import { MessageObject } from '../utils/web3'
import { useEffect, useState } from 'react'
import Web3 from 'web3'
import { Contract, EventData } from 'web3-eth-contract'
import { getAffirmationsSigned, getMessagesSigned } from '../utils/contract'
import {
  BLOCK_RANGE,
  CONFIRMATIONS_STATUS,
  FOREIGN_RPC_POLLING_INTERVAL,
  HOME_RPC_POLLING_INTERVAL,
  VALIDATOR_CONFIRMATION_STATUS
} from '../config/constants'
import validatorsCache from '../services/ValidatorsCache'
import {
  homeBlockNumberProvider,
  foreignBlockNumberProvider,
  BlockNumberProvider
} from '../services/BlockNumberProvider'

export interface useMessageConfirmationsParams {
  message: MessageObject
  receipt: Maybe<TransactionReceipt>
  fromHome: boolean
}

export interface ConfirmationParam {
  validator: string
  status: string
}

export interface ExecutionData {
  status: string
  validator: string
  txHash: string
  timestamp: number
  executionResult: boolean
}

export const useMessageConfirmations = ({ message, receipt, fromHome }: useMessageConfirmationsParams) => {
  const { home, foreign } = useStateProvider()
  const [confirmations, setConfirmations] = useState<Array<ConfirmationParam>>([])
  const [status, setStatus] = useState(CONFIRMATIONS_STATUS.UNDEFINED)
  const [waitingBlocks, setWaitingBlocks] = useState(false)
  const [waitingBlocksResolved, setWaitingBlocksResolved] = useState(false)
  const [signatureCollected, setSignatureCollected] = useState(false)
  const [collectedSignaturesEvent, setCollectedSignaturesEvent] = useState<Maybe<EventData>>(null)
  const [executionData, setExecutionData] = useState<ExecutionData>({
    status: VALIDATOR_CONFIRMATION_STATUS.UNDEFINED,
    validator: '',
    txHash: '',
    timestamp: 0,
    executionResult: false
  })
  const [waitingBlocksForExecution, setWaitingBlocksForExecution] = useState(false)
  const [waitingBlocksForExecutionResolved, setWaitingBlocksForExecutionResolved] = useState(false)

  useEffect(
    () => {
      if (!receipt) return

      const subscriptions: Array<number> = []

      const unsubscribe = () => {
        subscriptions.forEach(s => {
          clearTimeout(s)
        })
      }

      const blockProvider = fromHome ? homeBlockNumberProvider : foreignBlockNumberProvider
      const interval = fromHome ? HOME_RPC_POLLING_INTERVAL : FOREIGN_RPC_POLLING_INTERVAL
      const web3 = fromHome ? home.web3 : foreign.web3
      blockProvider.start(web3)

      const requiredBlockConfirmations = fromHome ? home.blockConfirmations : foreign.blockConfirmations
      const targetBlock = receipt.blockNumber + requiredBlockConfirmations

      const checkWaitingForBLocks = async (
        targetBlock: number,
        setWaitingStatus: Function,
        setWaitingBlocksResolved: Function,
        validatorList: string[],
        setConfirmations: Function
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
              checkWaitingForBLocks(
                targetBlock,
                setWaitingStatus,
                setWaitingBlocksResolved,
                validatorList,
                setConfirmations
              ),
            nextInterval
          )
          subscriptions.push(timeoutId)
        }
      }

      checkWaitingForBLocks(
        targetBlock,
        setWaitingBlocks,
        setWaitingBlocksResolved,
        home.validatorList,
        setConfirmations
      )

      return () => {
        unsubscribe()
        blockProvider.stop()
      }
    },
    [
      foreign.blockConfirmations,
      foreign.web3,
      fromHome,
      home.blockConfirmations,
      home.validatorList,
      home.web3,
      receipt
    ]
  )

  // The collected signature event is only fetched once the signatures are collected on tx from home to foreign, to calculate if
  // the execution tx on the foreign network is waiting for block confirmations
  useEffect(
    () => {
      if (!fromHome || !receipt || !home.web3 || !signatureCollected) return

      const subscriptions: Array<number> = []

      const unsubscribe = () => {
        subscriptions.forEach(s => {
          clearTimeout(s)
        })
      }

      homeBlockNumberProvider.start(home.web3)

      const fromBlock = receipt.blockNumber
      const toBlock = fromBlock + BLOCK_RANGE
      const messageHash = home.web3.utils.soliditySha3Raw(message.data)

      const getCollectedSignaturesEvent = async (
        web3: Maybe<Web3>,
        contract: Maybe<Contract>,
        fromBlock: number,
        toBlock: number,
        messageHash: string,
        setCollectedSignaturesEvent: Function
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
          homeBlockNumberProvider.stop()
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
                setCollectedSignaturesEvent
              ),
            500
          )
          subscriptions.push(timeoutId)
        }
      }

      getCollectedSignaturesEvent(
        home.web3,
        home.bridgeContract,
        fromBlock,
        toBlock,
        messageHash,
        setCollectedSignaturesEvent
      )

      return () => {
        unsubscribe()
        homeBlockNumberProvider.stop()
      }
    },
    [fromHome, home.bridgeContract, home.web3, message.data, receipt, signatureCollected]
  )

  useEffect(
    () => {
      if (!fromHome || !home.web3 || !receipt || !collectedSignaturesEvent) return

      const subscriptions: Array<number> = []

      const unsubscribe = () => {
        subscriptions.forEach(s => {
          clearTimeout(s)
        })
      }

      homeBlockNumberProvider.start(home.web3)
      const targetBlock = collectedSignaturesEvent.blockNumber + home.blockConfirmations

      const checkWaitingBlocksForExecution = async (blockProvider: BlockNumberProvider, interval: number) => {
        const currentBlock = blockProvider.get()

        if (currentBlock && currentBlock >= targetBlock) {
          setWaitingBlocksForExecution(false)
          setWaitingBlocksForExecutionResolved(true)
          blockProvider.stop()
        } else {
          let nextInterval = interval
          if (!currentBlock) {
            nextInterval = 500
          } else {
            setWaitingBlocksForExecution(true)
            setExecutionData({
              status: VALIDATOR_CONFIRMATION_STATUS.WAITING,
              validator: collectedSignaturesEvent.returnValues.authorityResponsibleForRelay,
              txHash: '',
              timestamp: 0,
              executionResult: false
            })
          }
          const timeoutId = setTimeout(() => checkWaitingBlocksForExecution(blockProvider, interval), nextInterval)
          subscriptions.push(timeoutId)
        }
      }

      checkWaitingBlocksForExecution(homeBlockNumberProvider, HOME_RPC_POLLING_INTERVAL)

      return () => {
        unsubscribe()
        homeBlockNumberProvider.stop()
      }
    },
    [collectedSignaturesEvent, fromHome, home.blockConfirmations, home.web3, receipt]
  )

  useEffect(
    () => {
      const subscriptions: Array<number> = []

      const unsubscribe = () => {
        subscriptions.forEach(s => {
          clearTimeout(s)
        })
      }

      const confirmationContractMethod = fromHome ? getMessagesSigned : getAffirmationsSigned

      const getConfirmationsForTx = async (
        messageData: string,
        web3: Maybe<Web3>,
        validatorList: string[],
        bridgeContract: Maybe<Contract>,
        confirmationContractMethod: Function,
        setResult: Function,
        requiredSignatures: number,
        setSignatureCollected: Function,
        waitingBlocksResolved: boolean
      ) => {
        if (!web3 || !validatorList || !bridgeContract || !waitingBlocksResolved) return
        const hashMsg = web3.utils.soliditySha3Raw(messageData)
        let validatorConfirmations = await Promise.all(
          validatorList.map(async validator => {
            const hashSenderMsg = web3.utils.soliditySha3Raw(validator, hashMsg)

            const signatureFromCache = validatorsCache.get(hashSenderMsg)
            if (signatureFromCache) {
              return {
                validator,
                status: VALIDATOR_CONFIRMATION_STATUS.SUCCESS
              }
            }

            const confirmed = await confirmationContractMethod(bridgeContract, hashSenderMsg)
            const status = confirmed ? VALIDATOR_CONFIRMATION_STATUS.SUCCESS : VALIDATOR_CONFIRMATION_STATUS.UNDEFINED

            // If validator confirmed signature, we cache the result to avoid doing future requests for a result that won't change
            if (confirmed) {
              validatorsCache.set(hashSenderMsg, confirmed)
            }

            return {
              validator,
              status
            }
          })
        )

        const successConfirmations = validatorConfirmations.filter(
          c => c.status === VALIDATOR_CONFIRMATION_STATUS.SUCCESS
        )

        // If signatures not collected, it needs to retry in the next blocks
        if (successConfirmations.length !== requiredSignatures) {
          const timeoutId = setTimeout(
            () =>
              getConfirmationsForTx(
                messageData,
                web3,
                validatorList,
                bridgeContract,
                confirmationContractMethod,
                setResult,
                requiredSignatures,
                setSignatureCollected,
                waitingBlocksResolved
              ),
            HOME_RPC_POLLING_INTERVAL
          )
          subscriptions.push(timeoutId)
        } else {
          // If signatures collected, it should set other signatures as not required
          const notSuccessConfirmations = validatorConfirmations.filter(
            c => c.status !== VALIDATOR_CONFIRMATION_STATUS.SUCCESS
          )
          const notRequiredConfirmations = notSuccessConfirmations.map(c => ({
            validator: c.validator,
            status: VALIDATOR_CONFIRMATION_STATUS.NOT_REQUIRED
          }))

          validatorConfirmations = [...successConfirmations, ...notRequiredConfirmations]
          setSignatureCollected(true)
        }
        setResult(validatorConfirmations)
      }

      getConfirmationsForTx(
        message.data,
        home.web3,
        home.validatorList,
        home.bridgeContract,
        confirmationContractMethod,
        setConfirmations,
        home.requiredSignatures,
        setSignatureCollected,
        waitingBlocksResolved
      )

      return () => {
        unsubscribe()
      }
    },
    [
      fromHome,
      message.data,
      home.web3,
      home.validatorList,
      home.bridgeContract,
      home.requiredSignatures,
      waitingBlocksResolved
    ]
  )

  useEffect(
    () => {
      if (fromHome && !waitingBlocksForExecutionResolved) return

      const subscriptions: Array<number> = []

      const unsubscribe = () => {
        subscriptions.forEach(s => {
          clearTimeout(s)
        })
      }

      const contractEvent = fromHome ? 'RelayedMessage' : 'AffirmationCompleted'
      const bridgeContract = fromHome ? foreign.bridgeContract : home.bridgeContract
      const providedWeb3 = fromHome ? foreign.web3 : home.web3
      const pollingInterval = fromHome ? FOREIGN_RPC_POLLING_INTERVAL : HOME_RPC_POLLING_INTERVAL

      const getFinalizationEvent = async (
        contract: Maybe<Contract>,
        eventName: string,
        web3: Maybe<Web3>,
        setResult: React.Dispatch<React.SetStateAction<ExecutionData>>,
        waitingBlocksResolved: boolean
      ) => {
        if (!contract || !web3 || !waitingBlocksResolved) return
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
          const timeoutId = setTimeout(
            () => getFinalizationEvent(contract, eventName, web3, setResult, waitingBlocksResolved),
            pollingInterval
          )
          subscriptions.push(timeoutId)
        }
      }

      getFinalizationEvent(bridgeContract, contractEvent, providedWeb3, setExecutionData, waitingBlocksResolved)

      return () => {
        unsubscribe()
      }
    },
    [
      fromHome,
      foreign.bridgeContract,
      home.bridgeContract,
      message.id,
      foreign.web3,
      home.web3,
      waitingBlocksResolved,
      waitingBlocksForExecutionResolved
    ]
  )

  useEffect(
    () => {
      if (executionData.txHash) {
        const newStatus = executionData.executionResult
          ? CONFIRMATIONS_STATUS.SUCCESS
          : CONFIRMATIONS_STATUS.SUCCESS_MESSAGE_FAILED
        setStatus(newStatus)
      } else if (signatureCollected) {
        if (fromHome) {
          if (waitingBlocksForExecution) {
            setStatus(CONFIRMATIONS_STATUS.EXECUTION_WAITING)
          } else {
            setStatus(CONFIRMATIONS_STATUS.UNDEFINED)
          }
        } else {
          setStatus(CONFIRMATIONS_STATUS.UNDEFINED)
        }
      } else if (waitingBlocks) {
        setStatus(CONFIRMATIONS_STATUS.WAITING)
      }
    },
    [executionData, fromHome, signatureCollected, waitingBlocks, waitingBlocksForExecution]
  )

  return {
    confirmations,
    status,
    signatureCollected,
    executionData
  }
}
