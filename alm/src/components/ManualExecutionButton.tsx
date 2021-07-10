import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { InjectedConnector } from '@web3-react/injected-connector'
import { useWeb3React } from '@web3-react/core'
import {
  DOUBLE_EXECUTION_ATTEMPT_ERROR,
  EXECUTION_FAILED_ERROR,
  EXECUTION_OUT_OF_GAS_ERROR,
  FOREIGN_EXPLORER_API,
  INCORRECT_CHAIN_ERROR,
  VALIDATOR_CONFIRMATION_STATUS
} from '../config/constants'
import { useStateProvider } from '../state/StateProvider'
import { signatureToVRS, packSignatures } from '../utils/signatures'
import { getSuccessExecutionData } from '../utils/getFinalizationEvent'
import { TransactionReceipt } from 'web3-eth'

const ActionButton = styled.button`
  color: var(--button-color);
  border-color: var(--font-color);
  margin-top: 10px;
  min-width: 120px;
  padding: 1rem;
  &:focus {
    outline: var(--button-color);
  }
`

interface ManualExecutionButtonParams {
  safeExecutionAvailable: boolean
  messageData: string
  setExecutionData: Function
  signatureCollected: string[]
  setPendingExecution: Function
}

export const ManualExecutionButton = ({
  safeExecutionAvailable,
  messageData,
  setExecutionData,
  signatureCollected,
  setPendingExecution
}: ManualExecutionButtonParams) => {
  const { foreign, setError } = useStateProvider()
  const { library, activate, account, active } = useWeb3React()
  const [manualExecution, setManualExecution] = useState(false)
  const [allowFailures, setAllowFailures] = useState(false)

  useEffect(
    () => {
      if (!manualExecution || !foreign.chainId) return

      if (!active) {
        activate(new InjectedConnector({ supportedChainIds: [foreign.chainId] }), e => {
          if (e.message.includes('Unsupported chain id')) {
            setError(INCORRECT_CHAIN_ERROR)
            const { ethereum } = window as any

            // remove the error message after chain is correctly changed to the foreign one
            const listener = (chainId: string) => {
              if (parseInt(chainId.slice(2), 16) === foreign.chainId) {
                ethereum.removeListener('chainChanged', listener)
                setError((error: string) => (error === INCORRECT_CHAIN_ERROR ? '' : error))
              }
            }
            ethereum.on('chainChanged', listener)
          } else {
            setError(e.message)
          }
          setManualExecution(false)
        })
        return
      }

      if (!library || !foreign.bridgeContract || !signatureCollected || !signatureCollected.length) return

      const signatures = packSignatures(signatureCollected.map(signatureToVRS))
      const messageId = messageData.slice(0, 66)
      const bridge = foreign.bridgeContract
      const executeMethod =
        safeExecutionAvailable && !allowFailures
          ? bridge.methods.safeExecuteSignaturesWithAutoGasLimit
          : bridge.methods.executeSignatures
      const data = executeMethod(messageData, signatures).encodeABI()
      setManualExecution(false)

      library.eth
        .sendTransaction({
          from: account,
          to: foreign.bridgeAddress,
          data
        })
        .on('transactionHash', (txHash: string) => {
          setExecutionData({
            status: VALIDATOR_CONFIRMATION_STATUS.PENDING,
            validator: account,
            txHash,
            timestamp: Math.floor(new Date().getTime() / 1000.0),
            executionResult: false
          })
          setPendingExecution(true)
        })
        .on('error', async (e: Error, receipt: TransactionReceipt) => {
          if (e.message.includes('Transaction has been reverted by the EVM')) {
            const successExecutionData = await getSuccessExecutionData(
              bridge,
              'RelayedMessage',
              library,
              messageId,
              FOREIGN_EXPLORER_API
            )
            if (successExecutionData) {
              setExecutionData(successExecutionData)
              setError(DOUBLE_EXECUTION_ATTEMPT_ERROR)
            } else {
              const { gas } = await library.eth.getTransaction(receipt.transactionHash)
              setExecutionData({
                status: VALIDATOR_CONFIRMATION_STATUS.FAILED,
                validator: account,
                txHash: receipt.transactionHash,
                timestamp: Math.floor(new Date().getTime() / 1000.0),
                executionResult: false
              })
              setError(gas === receipt.gasUsed ? EXECUTION_OUT_OF_GAS_ERROR : EXECUTION_FAILED_ERROR)
            }
          } else {
            setError(e.message)
          }
        })
    },
    [
      manualExecution,
      library,
      activate,
      active,
      account,
      foreign.chainId,
      foreign.bridgeAddress,
      foreign.bridgeContract,
      setError,
      messageData,
      signatureCollected,
      setExecutionData,
      setPendingExecution,
      safeExecutionAvailable,
      allowFailures
    ]
  )

  return (
    <div>
      <div className="is-center">
        <ActionButton className="button outline" onClick={() => setManualExecution(true)}>
          Execute
        </ActionButton>
      </div>
      {safeExecutionAvailable && (
        <div
          title="Allow executed message to fail and record its failure on-chain without reverting the whole transaction.
          Use fixed gas limit for execution."
          className="is-center"
          style={{ paddingTop: 10 }}
        >
          <input
            type="checkbox"
            id="allow-failures"
            checked={allowFailures}
            onChange={e => setAllowFailures(e.target.checked)}
          />
          <label htmlFor="allow-failures">Unsafe mode</label>
        </div>
      )}
    </div>
  )
}
