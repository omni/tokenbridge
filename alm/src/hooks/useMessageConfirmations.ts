import { useStateProvider } from '../state/StateProvider'
import { TransactionReceipt } from 'web3-eth'
import { MessageObject } from '../utils/web3'
import { useEffect, useState } from 'react'
import { EventData } from 'web3-eth-contract'
import {
  BLOCK_RANGE,
  CONFIRMATIONS_STATUS,
  FOREIGN_RPC_POLLING_INTERVAL,
  HOME_RPC_POLLING_INTERVAL,
  VALIDATOR_CONFIRMATION_STATUS
} from '../config/constants'
import { homeBlockNumberProvider, foreignBlockNumberProvider } from '../services/BlockNumberProvider'
import { checkSignaturesWaitingForBLocks } from '../utils/signatureWaitingForBlocks'
import { getCollectedSignaturesEvent } from '../utils/getCollectedSignaturesEvent'
import { checkWaitingBlocksForExecution } from '../utils/executionWaitingForBlocks'
import { getConfirmationsForTx } from '../utils/getConfirmationsForTx'
import { getFinalizationEvent } from '../utils/getFinalizationEvent'
import {
  getValidatorFailedTransactionsForMessage,
  getExecutionFailedTransactionForMessage,
  getValidatorPendingTransactionsForMessage,
  getExecutionPendingTransactionsForMessage,
  getValidatorSuccessTransactionsForMessage
} from '../utils/explorer'

export interface useMessageConfirmationsParams {
  message: MessageObject
  receipt: Maybe<TransactionReceipt>
  fromHome: boolean
  timestamp: number
  requiredSignatures: number
  validatorList: string[]
  blockConfirmations: number
}

export interface BasicConfirmationParam {
  validator: string
  status: string
}

export interface ConfirmationParam extends BasicConfirmationParam {
  txHash: string
  timestamp: number
  signature?: string
}

export interface ExecutionData {
  status: string
  validator: string
  txHash: string
  timestamp: number
  executionResult: boolean
}

export const useMessageConfirmations = ({
  message,
  receipt,
  fromHome,
  timestamp,
  requiredSignatures,
  validatorList,
  blockConfirmations
}: useMessageConfirmationsParams) => {
  const { home, foreign } = useStateProvider()
  const { confirmations, setConfirmations } = home
  const [status, setStatus] = useState(CONFIRMATIONS_STATUS.UNDEFINED)
  const [waitingBlocks, setWaitingBlocks] = useState(false)
  const [waitingBlocksResolved, setWaitingBlocksResolved] = useState(false)
  const [signatureCollected, setSignatureCollected] = useState(false)
  const [executionEventsFetched, setExecutionEventsFetched] = useState(false)
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
  const [failedConfirmations, setFailedConfirmations] = useState(false)
  const [failedExecution, setFailedExecution] = useState(false)
  const [pendingConfirmations, setPendingConfirmations] = useState(false)
  const [pendingExecution, setPendingExecution] = useState(false)

  const existsConfirmation = (confirmationArray: ConfirmationParam[]) => {
    const filteredList = confirmationArray.filter(
      c => c.status !== VALIDATOR_CONFIRMATION_STATUS.UNDEFINED && c.status !== VALIDATOR_CONFIRMATION_STATUS.WAITING
    )
    return filteredList.length > 0
  }

  // Check if the validators are waiting for block confirmations to verify the message
  useEffect(
    () => {
      if (!receipt || !blockConfirmations) return

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

      const targetBlock = receipt.blockNumber + blockConfirmations

      checkSignaturesWaitingForBLocks(
        targetBlock,
        setWaitingBlocks,
        setWaitingBlocksResolved,
        validatorList,
        setConfirmations,
        blockProvider,
        interval,
        subscriptions
      )

      return () => {
        unsubscribe()
        blockProvider.stop()
      }
    },
    [blockConfirmations, foreign.web3, fromHome, validatorList, home.web3, receipt, setConfirmations]
  )

  // The collected signature event is only fetched once the signatures are collected on tx from home to foreign, to calculate if
  // the execution tx on the foreign network is waiting for block confirmations
  // This is executed if the message is in Home to Foreign direction only
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

      getCollectedSignaturesEvent(
        home.web3,
        home.bridgeContract,
        fromBlock,
        toBlock,
        messageHash,
        setCollectedSignaturesEvent,
        subscriptions
      )

      return () => {
        unsubscribe()
        homeBlockNumberProvider.stop()
      }
    },
    [fromHome, home.bridgeContract, home.web3, message.data, receipt, signatureCollected]
  )

  // Check if the responsible validator is waiting for block confirmations to execute the message on foreign network
  // This is executed if the message is in Home to Foreign direction only
  useEffect(
    () => {
      if (!fromHome || !home.web3 || !receipt || !collectedSignaturesEvent || !blockConfirmations) return

      const subscriptions: Array<number> = []

      const unsubscribe = () => {
        subscriptions.forEach(s => {
          clearTimeout(s)
        })
      }

      homeBlockNumberProvider.start(home.web3)
      const targetBlock = collectedSignaturesEvent.blockNumber + blockConfirmations

      checkWaitingBlocksForExecution(
        homeBlockNumberProvider,
        HOME_RPC_POLLING_INTERVAL,
        targetBlock,
        collectedSignaturesEvent,
        setWaitingBlocksForExecution,
        setWaitingBlocksForExecutionResolved,
        setExecutionData,
        subscriptions
      )

      return () => {
        unsubscribe()
        homeBlockNumberProvider.stop()
      }
    },
    [collectedSignaturesEvent, fromHome, blockConfirmations, home.web3, receipt]
  )

  // Checks if validators verified the message
  // To avoid making extra requests, this is only executed when validators finished waiting for blocks confirmations
  useEffect(
    () => {
      if (!waitingBlocksResolved || !timestamp || !requiredSignatures) return

      const subscriptions: Array<number> = []

      const unsubscribe = () => {
        subscriptions.forEach(s => {
          clearTimeout(s)
        })
      }

      getConfirmationsForTx(
        message.data,
        home.web3,
        validatorList,
        home.bridgeContract,
        fromHome,
        setConfirmations,
        requiredSignatures,
        setSignatureCollected,
        waitingBlocksResolved,
        subscriptions,
        timestamp,
        getValidatorFailedTransactionsForMessage,
        setFailedConfirmations,
        getValidatorPendingTransactionsForMessage,
        setPendingConfirmations,
        getValidatorSuccessTransactionsForMessage
      )

      return () => {
        unsubscribe()
      }
    },
    [
      fromHome,
      message.data,
      home.web3,
      validatorList,
      home.bridgeContract,
      requiredSignatures,
      waitingBlocksResolved,
      timestamp,
      setConfirmations
    ]
  )

  // Gets finalization event to display the information about the execution of the message
  // In a message from Home to Foreign it will be executed after finishing waiting for block confirmations for the execution transaction on Foreign
  // In a message from Foreign to Home it will be executed after finishing waiting for block confirmations of the message request
  useEffect(
    () => {
      if ((fromHome && !waitingBlocksForExecutionResolved) || (!fromHome && !waitingBlocksResolved)) return

      const subscriptions: Array<number> = []

      const unsubscribe = () => {
        subscriptions.forEach(s => {
          clearTimeout(s)
        })
      }

      const contractEvent = fromHome ? 'RelayedMessage' : 'AffirmationCompleted'
      const bridgeContract = fromHome ? foreign.bridgeContract : home.bridgeContract
      const providedWeb3 = fromHome ? foreign.web3 : home.web3
      const interval = fromHome ? FOREIGN_RPC_POLLING_INTERVAL : HOME_RPC_POLLING_INTERVAL

      getFinalizationEvent(
        bridgeContract,
        contractEvent,
        providedWeb3,
        setExecutionData,
        waitingBlocksResolved,
        message,
        interval,
        subscriptions,
        timestamp,
        collectedSignaturesEvent,
        getExecutionFailedTransactionForMessage,
        setFailedExecution,
        getExecutionPendingTransactionsForMessage,
        setPendingExecution,
        setExecutionEventsFetched
      )

      return () => {
        unsubscribe()
      }
    },
    [
      fromHome,
      foreign.bridgeContract,
      home.bridgeContract,
      message,
      foreign.web3,
      home.web3,
      waitingBlocksResolved,
      waitingBlocksForExecutionResolved,
      timestamp,
      collectedSignaturesEvent
    ]
  )

  // Sets the message status based in the collected information
  useEffect(
    () => {
      if (executionData.status === VALIDATOR_CONFIRMATION_STATUS.SUCCESS && existsConfirmation(confirmations)) {
        const newStatus = executionData.executionResult
          ? CONFIRMATIONS_STATUS.SUCCESS
          : CONFIRMATIONS_STATUS.SUCCESS_MESSAGE_FAILED
        setStatus(newStatus)
      } else if (signatureCollected) {
        if (fromHome) {
          if (waitingBlocksForExecution) {
            setStatus(CONFIRMATIONS_STATUS.EXECUTION_WAITING)
          } else if (failedExecution) {
            setStatus(CONFIRMATIONS_STATUS.EXECUTION_FAILED)
          } else if (pendingExecution) {
            setStatus(CONFIRMATIONS_STATUS.EXECUTION_PENDING)
          } else if (waitingBlocksForExecutionResolved) {
            setStatus(CONFIRMATIONS_STATUS.EXECUTION_WAITING)
          } else {
            setStatus(CONFIRMATIONS_STATUS.EXECUTION_WAITING)
          }
        } else {
          setStatus(CONFIRMATIONS_STATUS.UNDEFINED)
        }
      } else if (waitingBlocks) {
        setStatus(CONFIRMATIONS_STATUS.WAITING_CHAIN)
      } else if (failedConfirmations) {
        setStatus(CONFIRMATIONS_STATUS.FAILED)
      } else if (pendingConfirmations) {
        setStatus(CONFIRMATIONS_STATUS.PENDING)
      } else if (waitingBlocksResolved && existsConfirmation(confirmations)) {
        setStatus(CONFIRMATIONS_STATUS.WAITING_VALIDATORS)
      } else if (waitingBlocksResolved) {
        setStatus(CONFIRMATIONS_STATUS.SEARCHING)
      } else {
        setStatus(CONFIRMATIONS_STATUS.UNDEFINED)
      }
    },
    [
      executionData,
      fromHome,
      signatureCollected,
      waitingBlocks,
      waitingBlocksForExecution,
      failedConfirmations,
      failedExecution,
      pendingConfirmations,
      pendingExecution,
      waitingBlocksResolved,
      confirmations,
      waitingBlocksForExecutionResolved
    ]
  )

  return {
    status,
    signatureCollected,
    executionData,
    setExecutionData,
    waitingBlocksResolved,
    executionEventsFetched,
    setPendingExecution
  }
}
