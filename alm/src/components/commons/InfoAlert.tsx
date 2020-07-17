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

export const InfoAlert = ({ onClick, children }: { onClick: () => void; children: React.ReactChild[] }) => (
  <div className="row is-center">
    <StyledInfoAlert className="col-10 is-vertical-align">
      <InfoIcon />
      <div className="col-10 is-left">{children}</div>
      <CloseIconContainer className="col-1 is-vertical-align is-center" onClick={onClick}>
        <CloseIcon />
      </CloseIconContainer>
    </StyledInfoAlert>
  </div>
)
