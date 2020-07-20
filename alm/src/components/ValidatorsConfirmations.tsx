import React from 'react'
import { formatTimestamp, formatTxHash, getExplorerTxUrl } from '../utils/networks'
import { useWindowWidth } from '@react-hook/window-size'
import { SEARCHING_TX, VALIDATOR_CONFIRMATION_STATUS } from '../config/constants'
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
        return <SuccessLabel>{validatorStatus}</SuccessLabel>
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
          {validatorList.map((validator, i) => {
            const filteredConfirmation = confirmations.filter(c => c.validator === validator)
            const confirmation = filteredConfirmation.length > 0 ? filteredConfirmation[0] : null
            const displayedStatus = confirmation && confirmation.status ? confirmation.status : ''
            const explorerLink = confirmation && confirmation.txHash ? getExplorerTxUrl(confirmation.txHash, true) : ''
            const elementIfNoTimestamp =
              displayedStatus !== VALIDATOR_CONFIRMATION_STATUS.WAITING &&
              displayedStatus !== VALIDATOR_CONFIRMATION_STATUS.NOT_REQUIRED ? (
                (displayedStatus === VALIDATOR_CONFIRMATION_STATUS.UNDEFINED || displayedStatus === '') &&
                waitingBlocksResolved ? (
                  SEARCHING_TX
                ) : (
                  <SimpleLoading />
                )
              ) : (
                ''
              )
            return (
              <tr key={i}>
                <td>{windowWidth < 850 ? formatTxHash(validator) : validator}</td>
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
        {requiredSignatures} of {validatorList.length} confirmations required
      </RequiredConfirmations>
    </div>
  )
}
