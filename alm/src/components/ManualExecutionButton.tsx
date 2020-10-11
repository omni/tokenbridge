import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { InjectedConnector } from '@web3-react/injected-connector'
import { useWeb3React } from '@web3-react/core'
import { VALIDATOR_CONFIRMATION_STATUS } from '../config/constants'
import { useStateProvider } from '../state/StateProvider'
import { signatureToVRS, packSignatures } from '../utils/signatures'

const StyledButton = styled.button`
  color: var(--button-color);
  border-color: var(--font-color);
  margin-top: 10px;
  &:focus {
    outline: var(--button-color);
  }
`

export interface BackButtonParam {
  onBackToMain: () => void
}

interface ManualExecutionButtonParams {
  messageData: string
  setExecutionData: Function
  requiredSignatures: number
}

export const ManualExecutionButton = ({
  messageData,
  setExecutionData,
  requiredSignatures
}: ManualExecutionButtonParams) => {
  const { home, foreign } = useStateProvider()
  const { library, activate, account, active, error, setError } = useWeb3React()
  const [manualExecution, setManualExecution] = useState(false)
  const disabled =
    home.confirmations.filter(({ signature }) => signature && signature.startsWith('0x')).length < requiredSignatures

  useEffect(
    () => {
      if (!manualExecution || !foreign.chainId) return

      if (!active) {
        activate(new InjectedConnector({ supportedChainIds: [foreign.chainId] }), e => {
          setError(e)
          setManualExecution(false)
        })
        return
      }

      if (!library || !foreign.bridgeContract || !home.confirmations) return

      const collectedSignatures = home.confirmations
        .map(confirmation => confirmation.signature!)
        .filter(signature => signature && signature.startsWith('0x'))
      const signatures = packSignatures(collectedSignatures.map(signatureToVRS))
      const data = foreign.bridgeContract.methods.executeSignatures(messageData, signatures).encodeABI()
      setManualExecution(false)

      library.eth
        .sendTransaction({
          from: account,
          to: foreign.bridgeAddress,
          data
        })
        .on('transactionHash', (txHash: string) =>
          setExecutionData({
            status: VALIDATOR_CONFIRMATION_STATUS.PENDING,
            validator: account,
            txHash,
            timestamp: Math.floor(new Date().getTime() / 1000.0),
            executionResult: false
          })
        )
        .on('error', setError)
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
      home.confirmations,
      setExecutionData,
      error
    ]
  )

  return (
    <div>
      <StyledButton disabled={disabled} className="button outline is-left" onClick={() => setManualExecution(true)}>
        Execute signatures
      </StyledButton>
      {error && <span>{error.message}</span>}
    </div>
  )
}
