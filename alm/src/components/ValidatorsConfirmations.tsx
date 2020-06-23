import React from 'react'
import { formatTxHashExtended } from '../utils/networks'
import { useWindowWidth } from '@react-hook/window-size'
import { VALIDATOR_CONFIRMATION_STATUS } from '../config/constants'
import { SimpleLoading } from './commons/Loading'
import styled from 'styled-components'
import { ConfirmationParam } from '../hooks/useMessageConfirmations'
import { GreyLabel, RedLabel, SuccessLabel } from './commons/Labels'

const Thead = styled.thead`
  border-bottom: 2px solid #9e9e9e;
`

const RequiredConfirmations = styled.label`
  font-size: 14px;
`

export interface ValidatorsConfirmationsParams {
  confirmations: Array<ConfirmationParam>
  requiredSignatures: number
  validatorList: string[]
}

export const ValidatorsConfirmations = ({
  confirmations,
  requiredSignatures,
  validatorList
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
        return <SimpleLoading />
    }
  }

  return (
    <div>
      <table>
        <Thead>
          <tr>
            <th>Validator</th>
            <th className="is-center">Confirmations</th>
          </tr>
        </Thead>
        <tbody>
          {validatorList.map((validator, i) => {
            const filteredConfirmation = confirmations.filter(c => c.validator === validator)
            const confirmation = filteredConfirmation.length > 0 ? filteredConfirmation[0] : null
            const displayedStatus = confirmation && confirmation.status ? confirmation.status : ''
            return (
              <tr key={i}>
                <td>{windowWidth < 850 ? formatTxHashExtended(validator) : validator}</td>
                <td className="text-center">{getValidatorStatusElement(displayedStatus)}</td>
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
