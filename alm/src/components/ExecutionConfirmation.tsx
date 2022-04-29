import React, { useEffect, useState } from 'react'
import { formatTimestamp, formatTxHash, getExplorerTxUrl } from '../utils/networks'
import { useWindowWidth } from '@react-hook/window-size'
import { SEARCHING_TX, VALIDATOR_CONFIRMATION_STATUS, ALM_HOME_TO_FOREIGN_MANUAL_EXECUTION } from '../config/constants'
import { SimpleLoading } from './commons/Loading'
import styled from 'styled-components'
import { ConfirmationParam, ExecutionData } from '../hooks/useMessageConfirmations'
import { GreyLabel, RedLabel, SuccessLabel } from './commons/Labels'
import { ExplorerTxLink } from './commons/ExplorerTxLink'
import { Thead, AgeTd, StatusTd } from './commons/Table'
import { ManualExecutionButton } from './ManualExecutionButton'
import { useStateProvider } from '../state/StateProvider'
import { matchesRule, MessageObject, WarnRule } from '../utils/web3'
import { WarningAlert } from './commons/WarningAlert'
import { ErrorAlert } from './commons/ErrorAlert'

const StyledExecutionConfirmation = styled.div`
  margin-top: 30px;
`

export interface ExecutionConfirmationParams {
  message: MessageObject
  executionData: ExecutionData
  setExecutionData: Function
  confirmations: ConfirmationParam[]
  isHome: boolean
  executionEventsFetched: boolean
  setPendingExecution: Function
  dstRequiredSignatures: number
  dstValidatorList: string[]
}

export const ExecutionConfirmation = ({
  message,
  executionData,
  setExecutionData,
  confirmations,
  isHome,
  executionEventsFetched,
  setPendingExecution,
  dstRequiredSignatures,
  dstValidatorList
}: ExecutionConfirmationParams) => {
  const { foreign } = useStateProvider()
  const [safeExecutionAvailable, setSafeExecutionAvailable] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const availableManualExecution =
    !isHome &&
    (executionData.status === VALIDATOR_CONFIRMATION_STATUS.WAITING ||
      executionData.status === VALIDATOR_CONFIRMATION_STATUS.FAILED ||
      (executionData.status === VALIDATOR_CONFIRMATION_STATUS.UNDEFINED &&
        executionEventsFetched &&
        !!executionData.validator))
  const requiredManualExecution = availableManualExecution && ALM_HOME_TO_FOREIGN_MANUAL_EXECUTION
  const showAgeColumn = !requiredManualExecution || executionData.status === VALIDATOR_CONFIRMATION_STATUS.FAILED
  const windowWidth = useWindowWidth()

  const txExplorerLink = getExplorerTxUrl(executionData.txHash, isHome)
  const formattedValidator =
    windowWidth < 850 && executionData.validator ? formatTxHash(executionData.validator) : executionData.validator

  useEffect(
    () => {
      if (!availableManualExecution || !foreign.bridgeContract) return

      const p = foreign.bridgeContract.methods.getBridgeInterfacesVersion().call()
      p.then(({ major, minor }: any) => {
        major = parseInt(major, 10)
        minor = parseInt(minor, 10)
        if (major < 5 || (major === 5 && minor < 7)) return

        setSafeExecutionAvailable(true)
      })
    },
    [availableManualExecution, foreign.bridgeContract]
  )

  useEffect(
    () => {
      if (!message.data || !executionData || !availableManualExecution) return

      try {
        const fileName = 'warnRules'
        const rules: WarnRule[] = require(`../snapshots/${fileName}.json`)
        for (let rule of rules) {
          if (matchesRule(rule, message)) {
            setWarning(rule.message)
            return
          }
        }
      } catch (e) {}
    },
    [availableManualExecution, executionData, message, message.data, setWarning]
  )

  const getExecutionStatusElement = (validatorStatus = '') => {
    switch (validatorStatus) {
      case VALIDATOR_CONFIRMATION_STATUS.EXECUTION_SUCCESS:
        return <SuccessLabel>{validatorStatus}</SuccessLabel>
      case VALIDATOR_CONFIRMATION_STATUS.FAILED:
        return <RedLabel>{validatorStatus}</RedLabel>
      case VALIDATOR_CONFIRMATION_STATUS.PENDING:
      case VALIDATOR_CONFIRMATION_STATUS.WAITING:
        return <GreyLabel>{validatorStatus}</GreyLabel>
      default:
        return executionData.validator ? (
          <GreyLabel>{VALIDATOR_CONFIRMATION_STATUS.WAITING}</GreyLabel>
        ) : (
          <SimpleLoading />
        )
    }
  }

  return (
    <StyledExecutionConfirmation>
      {error && <ErrorAlert onClick={() => setError('')} error={error} />}
      {warning && <WarningAlert onClick={() => setWarning('')} error={warning} />}
      <table>
        <Thead>
          <tr>
            <th>{requiredManualExecution ? 'Execution info' : 'Executed by'}</th>
            <th className="text-center">Status</th>
            {showAgeColumn && <th className="text-center">Age</th>}
            {availableManualExecution && <th className="text-center">Actions</th>}
          </tr>
        </Thead>
        <tbody>
          <tr>
            <td>
              {requiredManualExecution ? (
                'Manual user action is required to complete the operation'
              ) : formattedValidator ? (
                formattedValidator
              ) : (
                <SimpleLoading />
              )}
            </td>
            <StatusTd className="text-center">{getExecutionStatusElement(executionData.status)}</StatusTd>
            {showAgeColumn && (
              <AgeTd className="text-center">
                {executionData.timestamp > 0 ? (
                  <ExplorerTxLink href={txExplorerLink} target="_blank">
                    {formatTimestamp(executionData.timestamp)}
                  </ExplorerTxLink>
                ) : executionData.status === VALIDATOR_CONFIRMATION_STATUS.WAITING ? (
                  ''
                ) : (
                  SEARCHING_TX
                )}
              </AgeTd>
            )}
            {availableManualExecution && (
              <td>
                <ManualExecutionButton
                  safeExecutionAvailable={safeExecutionAvailable}
                  messageData={message.data}
                  setExecutionData={setExecutionData}
                  confirmations={confirmations}
                  setPendingExecution={setPendingExecution}
                  setError={setError}
                  requiredSignatures={dstRequiredSignatures}
                  validatorList={dstValidatorList}
                />
              </td>
            )}
          </tr>
        </tbody>
      </table>
    </StyledExecutionConfirmation>
  )
}
