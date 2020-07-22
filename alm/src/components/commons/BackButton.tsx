import { Link } from 'react-router-dom'
import { LeftArrow } from './LeftArrow'
import React from 'react'
import styled from 'styled-components'

const StyledButton = styled.button`
  color: var(--button-color);
  border-color: var(--font-color);
  margin-top: 10px;
  &:focus {
    outline: var(--button-color);
  }
`

const BackLabel = styled.label`
  margin-left: 5px;
  cursor: pointer;
`

export interface BackButtonParam {
  onBackToMain: () => void
}

export const BackButton = ({ onBackToMain }: BackButtonParam) => (
  <div className="row is-center">
    <div className="col-9">
      <Link to="/" onClick={onBackToMain}>
        <StyledButton className="button outline is-left">
          <LeftArrow />
          <BackLabel>Search another transaction</BackLabel>
        </StyledButton>
      </Link>
    </div>
  </div>
)
