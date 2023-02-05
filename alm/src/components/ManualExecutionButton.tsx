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
import { ConfirmationParam } from '../hooks/useMessageConfirmations'

const ActionButton = styled.button`
  color: #ffffff;
  font-weight: 600;
  background: var(--button-color);
  border-color: var(--button-color);
  margin-top: 10px;
  min-width: 120px;
  padding: 1rem;
  &:focus {
    outline: none;
  }
`

interface ManualExecutionButtonParams {
  safeExecutionAvailable: boolean
  messageData: string
  setExecutionData: Function
  confirmations: ConfirmationParam[]
  setPendingExecution: Function
  setError: Function
  requiredSignatures: number
  validatorList: string[]
}

export const ManualExecutionButton = ({
  safeExecutionAvailable,
  messageData,
  setExecutionData,
  confirmations,
  setPendingExecution,
  setError,
  requiredSignatures,
  validatorList
}: ManualExecutionButtonParams) => {
  const { foreign } = useStateProvider()
  const { library, activate, account, active } = useWeb3React()
  const [manualExecution, setManualExecution] = useState(false)
  const [allowFailures, setAllowFailures] = useState(false)
  const [ready, setReady] = useState(false)
  const [title, setTitle] = useState('Loading')
  const [validSignatures, setValidSignatures] = useState<string[]>([])

  useEffect(
    () => {
      if (
        !foreign.bridgeContract ||
        !foreign.web3 ||
        !confirmations ||
        !confirmations.length ||
        !requiredSignatures ||
        !validatorList ||
        !validatorList.length
      )
        return

      const signatures = []
      for (let i = 0; i < confirmations.length && signatures.length < requiredSignatures; i++) {
        const sig = confirmations[i].signature
        if (!sig) {
          continue
        }
        const { v, r, s } = signatureToVRS(sig)
        const signer = foreign.web3.eth.accounts.recover(messageData, `0x${v}`, `0x${r}`, `0x${s}`)
        if (validatorList.includes(signer)) {
          signatures.push(sig)
        }
      }

      if (signatures.length >= requiredSignatures) {
        setValidSignatures(signatures.slice(0, requiredSignatures))
        setTitle('Execute')
        setReady(true)
      } else {
        setTitle('Unavailable')
      }
    },
    [
      foreign.bridgeContract,
      foreign.web3,
      validatorList,
      requiredSignatures,
      messageData,
      setValidSignatures,
      confirmations
    ]
  )

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

      if (!library || !foreign.bridgeContract || !foreign.web3 || !validSignatures || !validSignatures.length) return

      const signatures = packSignatures(validSignatures.map(signatureToVRS))
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
      setExecutionData,
      setPendingExecution,
      safeExecutionAvailable,
      allowFailures,
      foreign.web3,
      validSignatures
    ]
  )

  return (
    <div>
      <div className="is-center">
        <ActionButton disabled={!ready} className="button" onClick={() => setManualExecution(true)}>
          {title}
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
