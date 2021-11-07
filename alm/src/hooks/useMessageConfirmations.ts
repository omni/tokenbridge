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
  homeStartBlock: Maybe<number>
  foreignStartBlock: Maybe<number>
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
  homeStartBlock,
  foreignStartBlock,
  requiredSignatures,
  validatorList,
  blockConfirmations
}: useMessageConfirmationsParams) => {
  const { home, foreign } = useStateProvider()
  const [confirmations, setConfirmations] = useState<ConfirmationParam[]>([])
  const [status, setStatus] = useState(CONFIRMATIONS_STATUS.UNDEFINED)
  const [waitingBlocks, setWaitingBlocks] = useState(false)
  const [waitingBlocksResolved, setWaitingBlocksResolved] = useState(false)
  const [signatureCollected, setSignatureCollected] = useState<boolean | string[]>(false)
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

  const existsConfirmation = (confirmationArray: ConfirmationParam[]) =>
    confirmationArray.some(
      c => c.status !== VALIDATOR_CONFIRMATION_STATUS.UNDEFINED && c.status !== VALIDATOR_CONFIRMATION_STATUS.WAITING
    )

  // start watching blocks at the start
  useEffect(
    () => {
      if (!home.web3 || !foreign.web3) return

      homeBlockNumberProvider.start(home.web3)
      foreignBlockNumberProvider.start(foreign.web3)
    },
    [foreign.web3, home.web3]
  )

  // Check if the validators are waiting for block confirmations to verify the message
  useEffect(
    () => {
      if (!receipt || !blockConfirmations || waitingBlocksResolved) return

      let timeoutId: number

      const blockProvider = fromHome ? homeBlockNumberProvider : foreignBlockNumberProvider
      const interval = fromHome ? HOME_RPC_POLLING_INTERVAL : FOREIGN_RPC_POLLING_INTERVAL
      const targetBlock = receipt.blockNumber + blockConfirmations
      const validatorsWaiting = validatorList.map(validator => ({
        validator,
        status: VALIDATOR_CONFIRMATION_STATUS.WAITING,
        txHash: '',
        timestamp: 0
      }))

      const checkSignaturesWaitingForBLocks = () => {
        const currentBlock = blockProvider.get()

        if (currentBlock && currentBlock >= targetBlock) {
          setWaitingBlocksResolved(true)
          setWaitingBlocks(false)
        } else if (currentBlock) {
          setWaitingBlocks(true)
          setConfirmations(validatorsWaiting)
          timeoutId = window.setTimeout(checkSignaturesWaitingForBLocks, interval)
        } else {
          timeoutId = window.setTimeout(checkSignaturesWaitingForBLocks, 500)
        }
      }

      checkSignaturesWaitingForBLocks()

      return () => clearTimeout(timeoutId)
    },
    [blockConfirmations, fromHome, receipt, validatorList, waitingBlocksResolved]
  )

  // The collected signature event is only fetched once the signatures are collected on tx from home to foreign, to calculate if
  // the execution tx on the foreign network is waiting for block confirmations
  // This is executed if the message is in Home to Foreign direction only
  const hasCollectedSignatures = !!signatureCollected // true or string[]
  useEffect(
    () => {
      if (!fromHome || !receipt || !home.web3 || !home.bridgeContract || !hasCollectedSignatures) return

      let timeoutId: number
      let isCancelled = false

      const messageHash = home.web3.utils.soliditySha3Raw(message.data)
      const contract = home.bridgeContract

      const getCollectedSignaturesEvent = async (fromBlock: number, toBlock: number) => {
        const currentBlock = homeBlockNumberProvider.get()

        if (currentBlock) {
          // prevent errors if the toBlock parameter is bigger than the latest
          const securedToBlock = toBlock >= currentBlock ? currentBlock : toBlock
          const events = await contract.getPastEvents('CollectedSignatures', {
            fromBlock,
            toBlock: securedToBlock
          })
          const event = events.find(e => e.returnValues.messageHash === messageHash)
          if (event) {
            setCollectedSignaturesEvent(event)
          } else if (!isCancelled) {
            timeoutId = window.setTimeout(() => getCollectedSignaturesEvent(securedToBlock, securedToBlock + BLOCK_RANGE), 500)
          }
        } else if (!isCancelled) {
          timeoutId = window.setTimeout(() => getCollectedSignaturesEvent(fromBlock, toBlock), 500)
        }
      }

      getCollectedSignaturesEvent(receipt.blockNumber, receipt.blockNumber + BLOCK_RANGE)

      return () => {
        clearTimeout(timeoutId)
        isCancelled = true
      }
    },
    [fromHome, home.bridgeContract, home.web3, message.data, receipt, hasCollectedSignatures]
  )

  // Check if the responsible validator is waiting for block confirmations to execute the message on foreign network
  // This is executed if the message is in Home to Foreign direction only
  useEffect(
    () => {
      if (!fromHome || !home.web3 || !collectedSignaturesEvent || !blockConfirmations) return
      if (waitingBlocksForExecutionResolved) return

      let timeoutId: number

      const targetBlock = collectedSignaturesEvent.blockNumber + blockConfirmations

      const checkWaitingBlocksForExecution = () => {
        const currentBlock = homeBlockNumberProvider.get()

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
              data.status === VALIDATOR_CONFIRMATION_STATUS.UNDEFINED ||
              data.status === VALIDATOR_CONFIRMATION_STATUS.WAITING
                ? undefinedExecutionState
                : data
          )
          setWaitingBlocksForExecutionResolved(true)
          setWaitingBlocksForExecution(false)
        } else if (currentBlock) {
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
          timeoutId = window.setTimeout(() => checkWaitingBlocksForExecution(), HOME_RPC_POLLING_INTERVAL)
        } else {
          timeoutId = window.setTimeout(() => checkWaitingBlocksForExecution(), 500)
        }
      }

      checkWaitingBlocksForExecution()

      return () => clearTimeout(timeoutId)
    },
    [collectedSignaturesEvent, fromHome, blockConfirmations, home.web3, waitingBlocksForExecutionResolved]
  )

  // Checks if validators verified the message
  // To avoid making extra requests, this is only executed when validators finished waiting for blocks confirmations
  useEffect(
    () => {
      if (!waitingBlocksResolved || !homeStartBlock || !requiredSignatures || !home.web3 || !home.bridgeContract) return
      if (!validatorList || !validatorList.length) return

      let timeoutId: number
      let isCancelled = false

      getConfirmationsForTx(
        message.data,
        home.web3,
        validatorList,
        home.bridgeContract,
        fromHome,
        setConfirmations,
        requiredSignatures,
        setSignatureCollected,
        id => (timeoutId = id),
        () => isCancelled,
        homeStartBlock,
        getValidatorFailedTransactionsForMessage,
        setFailedConfirmations,
        getValidatorPendingTransactionsForMessage,
        setPendingConfirmations,
        getValidatorSuccessTransactionsForMessage
      )

      return () => {
        clearTimeout(timeoutId)
        isCancelled = true
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
      homeStartBlock
    ]
  )

  // Gets finalization event to display the information about the execution of the message
  // In a message from Home to Foreign it will be executed after finishing waiting for block confirmations for the execution transaction on Foreign
  // In a message from Foreign to Home it will be executed after finishing waiting for block confirmations of the message request
  useEffect(
    () => {
      if ((fromHome && !waitingBlocksForExecutionResolved) || (!fromHome && !waitingBlocksResolved)) return

      const bridgeContract = fromHome ? foreign.bridgeContract : home.bridgeContract
      const web3 = fromHome ? foreign.web3 : home.web3
      const startBlock = fromHome ? foreignStartBlock : homeStartBlock
      if (!startBlock || !bridgeContract || !web3) return

      let timeoutId: number
      let isCancelled = false

      getFinalizationEvent(
        fromHome,
        bridgeContract,
        web3,
        setExecutionData,
        message,
        id => (timeoutId = id),
        () => isCancelled,
        startBlock,
        collectedSignaturesEvent,
        getExecutionFailedTransactionForMessage,
        setFailedExecution,
        getExecutionPendingTransactionsForMessage,
        setPendingExecution,
        setExecutionEventsFetched
      )

      return () => {
        clearTimeout(timeoutId)
        isCancelled = true
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
      collectedSignaturesEvent,
      foreignStartBlock,
      homeStartBlock
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

        foreignBlockNumberProvider.stop()
        homeBlockNumberProvider.stop()
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
    confirmations,
    status,
    signatureCollected,
    executionData,
    setExecutionData,
    waitingBlocksResolved,
    executionEventsFetched,
    setPendingExecution
  }
}
