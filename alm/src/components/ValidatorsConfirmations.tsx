import React from 'react'
import { formatTimestamp, formatTxHash, getExplorerTxUrl } from '../utils/networks'
import { useWindowWidth } from '@react-hook/window-size'
import { RECENT_AGE, SEARCHING_TX, VALIDATOR_CONFIRMATION_STATUS } from '../config/constants'
import { SimpleLoading } from './commons/Loading'
import styled from 'styled-components'
import { ConfirmationParam } from '../hooks/useMessageConfirmations'
import { GreyLabel, RedLabel, SuccessLabel } from './commons/Labels'
import { ExplorerTxLink } from './commons/ExplorerTxLink'
import { Thead, AgeTd, StatusTd } from './commons/Table'

const RequiredConfirmations = styled.label`
  font-size: 14px;
`

export interface ValidatorsConfirmationsParams {
  confirmations: Array<ConfirmationParam>
  requiredSignatures: number
  validatorList: string[]
  waitingBlocksResolved: boolean
}

export const ValidatorsConfirmations = ({
  confirmations,
  requiredSignatures,
  validatorList,
  waitingBlocksResolved
}: ValidatorsConfirmationsParams) => {
  const windowWidth = useWindowWidth()

  const getValidatorStatusElement = (validatorStatus = '') => {
    switch (validatorStatus) {
      case VALIDATOR_CONFIRMATION_STATUS.SUCCESS:
      case VALIDATOR_CONFIRMATION_STATUS.MANUAL:
      case VALIDATOR_CONFIRMATION_STATUS.FAILED_VALID:
        return <SuccessLabel>{VALIDATOR_CONFIRMATION_STATUS.SUCCESS}</SuccessLabel>
      case VALIDATOR_CONFIRMATION_STATUS.FAILED:
        return <RedLabel>{validatorStatus}</RedLabel>
      case VALIDATOR_CONFIRMATION_STATUS.PENDING:
      case VALIDATOR_CONFIRMATION_STATUS.WAITING:
      case VALIDATOR_CONFIRMATION_STATUS.NOT_REQUIRED:
        return <GreyLabel>{validatorStatus}</GreyLabel>
      default:
        return waitingBlocksResolved ? (
          <GreyLabel>{VALIDATOR_CONFIRMATION_STATUS.WAITING}</GreyLabel>
        ) : (
          <SimpleLoading />
        )
    }
  }

  return (
    <div>
      <table>
        <Thead>
          <tr>
            <th>Validator</th>
            <th className="text-center">Status</th>
            <th className="text-center">Age</th>
          </tr>
        </Thead>
        <tbody>
          {confirmations.map((confirmation, i) => {
            const displayedStatus = confirmation.status
            const explorerLink = getExplorerTxUrl(confirmation.txHash, true)
            let elementIfNoTimestamp: any = <SimpleLoading />
            switch (displayedStatus) {
              case '':
              case VALIDATOR_CONFIRMATION_STATUS.UNDEFINED:
                if (waitingBlocksResolved) {
                  elementIfNoTimestamp = SEARCHING_TX
                }
                break
              case VALIDATOR_CONFIRMATION_STATUS.WAITING:
              case VALIDATOR_CONFIRMATION_STATUS.NOT_REQUIRED:
                elementIfNoTimestamp = ''
                break
              case VALIDATOR_CONFIRMATION_STATUS.MANUAL:
                elementIfNoTimestamp = RECENT_AGE
                break
            }
            return (
              <tr key={i}>
                <td>{windowWidth < 850 ? formatTxHash(confirmation.validator) : confirmation.validator}</td>
                <StatusTd className="text-center">{getValidatorStatusElement(displayedStatus)}</StatusTd>
                <AgeTd className="text-center">
                  {confirmation && confirmation.timestamp > 0 ? (
                    <ExplorerTxLink href={explorerLink} target="_blank">
                      {formatTimestamp(confirmation.timestamp)}
                    </ExplorerTxLink>
                  ) : (
                    elementIfNoTimestamp
                  )}
                </AgeTd>
              </tr>
            )
          })}
        </tbody>
      </table>
      <RequiredConfirmations>
        At least <strong>{requiredSignatures}</strong> of <strong>{validatorList.length}</strong> confirmations required
      </RequiredConfirmations>
    </div>
  )
}
