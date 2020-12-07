import React from 'react'
import { formatTimestamp, formatTxHash, getExplorerTxUrl } from '../utils/networks'
import { useWindowWidth } from '@react-hook/window-size'
import { SEARCHING_TX, VALIDATOR_CONFIRMATION_STATUS, ALM_HOME_TO_FOREIGN_MANUAL_EXECUTION } from '../config/constants'
import { SimpleLoading } from './commons/Loading'
import styled from 'styled-components'
import { ExecutionData } from '../hooks/useMessageConfirmations'
import { GreyLabel, RedLabel, SuccessLabel } from './commons/Labels'
import { ExplorerTxLink } from './commons/ExplorerTxLink'
import { Thead, AgeTd, StatusTd } from './commons/Table'
import { ManualExecutionButton } from './ManualExecutionButton'

const StyledExecutionConfirmation = styled.div`
  margin-top: 30px;
`

export interface ExecutionConfirmationParams {
  messageData: string
  executionData: ExecutionData
  setExecutionData: Function
  requiredSignatures: number
  isHome: boolean
  executionEventsFetched: boolean
  setPendingExecution: Function
}

export const ExecutionConfirmation = ({
  messageData,
  executionData,
  setExecutionData,
  requiredSignatures,
  isHome,
  executionEventsFetched,
  setPendingExecution
}: ExecutionConfirmationParams) => {
  const availableManualExecution =
    !isHome &&
    (executionData.status === VALIDATOR_CONFIRMATION_STATUS.WAITING ||
      (executionData.status === VALIDATOR_CONFIRMATION_STATUS.UNDEFINED &&
        executionEventsFetched &&
        !!executionData.validator))
  const requiredManualExecution = availableManualExecution && ALM_HOME_TO_FOREIGN_MANUAL_EXECUTION
  const windowWidth = useWindowWidth()

  const txExplorerLink = getExplorerTxUrl(executionData.txHash, isHome)
  const formattedValidator =
    windowWidth < 850 && executionData.validator ? formatTxHash(executionData.validator) : executionData.validator

  const getExecutionStatusElement = (validatorStatus = '') => {
    switch (validatorStatus) {
      case VALIDATOR_CONFIRMATION_STATUS.SUCCESS:
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
      <table>
        <Thead>
          <tr>
            <th>{requiredManualExecution ? 'Execution info' : 'Executed by'}</th>
            <th className="text-center">Status</th>
            {!requiredManualExecution && <th className="text-center">Age</th>}
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
            {!requiredManualExecution && (
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
                  messageData={messageData}
                  setExecutionData={setExecutionData}
                  requiredSignatures={requiredSignatures}
                  setPendingExecution={setPendingExecution}
                />
              </td>
            )}
          </tr>
        </tbody>
      </table>
    </StyledExecutionConfirmation>
  )
}
