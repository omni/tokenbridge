import React from 'react'
import styled from 'styled-components'
import { InfoIcon } from './InfoIcon'
import { CloseIcon } from './CloseIcon'

const StyledInfoAlert = styled.div`
  border: 1px solid var(--button-color);
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

export const InfoAlert = ({ onClick, children }: { onClick: () => void; children: React.ReactChild[] }) => (
  <div className="row is-center">
    <StyledInfoAlert className="col-10 is-vertical-align row">
      <InfoIcon />
      <TextContainer className="col-10">{children}</TextContainer>
      <CloseIconContainer className="col-1 is-vertical-align is-center" onClick={onClick}>
        <CloseIcon />
      </CloseIconContainer>
    </StyledInfoAlert>
  </div>
)
