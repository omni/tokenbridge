import React from 'react'
import { formatTxHashExtended } from '../utils/networks'
import { useStateProvider } from '../state/StateProvider'
import { useWindowWidth } from '@react-hook/window-size'
import { VALIDATOR_CONFIRMATION_STATUS } from '../config/constants'
import { SimpleLoading } from './commons/Loading'
import styled from 'styled-components'
import { ConfirmationParam } from '../hooks/useMessageConfirmations'

const Thead = styled.thead`
  border-bottom: 2px solid #9e9e9e;
`

const SuccessLabel = styled.label`
  color: var(--success-color);
  background-color: var(--success-bg-color);
  padding: 0.4rem 0.7rem;
  border-radius: 4px;
`

const RequiredConfirmations = styled.label`
  font-size: 14px;
`

export interface ValidatorsConfirmationsParams {
  confirmations: Array<ConfirmationParam>
}

export const ValidatorsConfirmations = ({ confirmations }: ValidatorsConfirmationsParams) => {
  const {
    home: { requiredSignatures, validatorList }
  } = useStateProvider()
  const windowWidth = useWindowWidth()

  const getValidatorStatusElement = (validatorStatus = '') => {
    switch (validatorStatus) {
      case VALIDATOR_CONFIRMATION_STATUS.SUCCESS:
        return <SuccessLabel>{validatorStatus}</SuccessLabel>
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
                <td>{windowWidth < 700 ? formatTxHashExtended(validator) : validator}</td>
                <td className="is-center">{getValidatorStatusElement(displayedStatus)}</td>
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
