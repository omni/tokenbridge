import React from 'react'
import { formatTimestamp, formatTxHash, getExplorerTxUrl } from '../utils/networks'
import { useWindowWidth } from '@react-hook/window-size'
import { VALIDATOR_CONFIRMATION_STATUS } from '../config/constants'
import { SimpleLoading } from './commons/Loading'
import styled from 'styled-components'
import { ExecutionData } from '../hooks/useMessageConfirmations'
import { GreyLabel, RedLabel, SuccessLabel } from './commons/Labels'
import { ExplorerTxLink } from './commons/ExplorerTxLink'

const Thead = styled.thead`
  border-bottom: 2px solid #9e9e9e;
`

const StyledExecutionConfirmation = styled.div`
  margin-top: 30px;
`

export interface ExecutionConfirmationParams {
  executionData: ExecutionData
  isHome: boolean
}

export const ExecutionConfirmation = ({ executionData, isHome }: ExecutionConfirmationParams) => {
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
        return <SimpleLoading />
    }
  }

  return (
    <StyledExecutionConfirmation>
      <table>
        <Thead>
          <tr>
            <th>Executed by</th>
            <th className="text-center">Status</th>
            <th className="text-center">Age</th>
          </tr>
        </Thead>
        <tbody>
          <tr>
            <td>{formattedValidator ? formattedValidator : <SimpleLoading />}</td>
            <td className="text-center">{getExecutionStatusElement(executionData.status)}</td>
            <td className="text-center">
              <ExplorerTxLink href={txExplorerLink} target="_blank">
                {executionData.timestamp > 0 ? formatTimestamp(executionData.timestamp) : ''}
              </ExplorerTxLink>
            </td>
          </tr>
        </tbody>
      </table>
    </StyledExecutionConfirmation>
  )
}
