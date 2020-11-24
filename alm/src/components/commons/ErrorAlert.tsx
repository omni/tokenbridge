import React from 'react'
import styled from 'styled-components'
import { InfoIcon } from './InfoIcon'
import { CloseIcon } from './CloseIcon'

const StyledErrorAlert = styled.div`
  border: 1px solid var(--failed-color);
  border-radius: 4px;
  margin-bottom: 20px;
  padding-top: 10px;
`

const CloseIconContainer = styled.div`
  cursor: pointer;
`

const TextContainer = styled.div`
  flex-direction: column;
`

export const ErrorAlert = ({ onClick, error }: { onClick: () => void; error: string }) => (
  <div className="row is-center">
    <StyledErrorAlert className="col-10 is-vertical-align row">
      <InfoIcon color="var(--failed-color)" />
      <TextContainer className="col-10">{error}</TextContainer>
      <CloseIconContainer className="col-1 is-vertical-align is-center" onClick={onClick}>
        <CloseIcon color="var(--failed-color)" />
      </CloseIconContainer>
    </StyledErrorAlert>
  </div>
)
