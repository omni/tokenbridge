import React from 'react'
import styled from 'styled-components'
import { InfoIcon } from './InfoIcon'
import { CloseIcon } from './CloseIcon'
import { ExplorerTxLink } from './ExplorerTxLink'

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
  white-space: pre-wrap;
  flex-direction: column;
`

export const ErrorAlert = ({ onClick, error }: { onClick: () => void; error: string }) => {
  const errorArray = error.split('%link')
  const text = errorArray[0]
  let link
  if (errorArray.length > 1) {
    link = (
      <ExplorerTxLink href={errorArray[1]} target="_blank" rel="noopener noreferrer">
        {errorArray[1]}
      </ExplorerTxLink>
    )
  }
  return (
    <div className="row is-center">
      <StyledErrorAlert className="col-10 is-vertical-align row">
        <InfoIcon color="var(--failed-color)" />
        <TextContainer className="col-10">
          {text}
          {link}
        </TextContainer>
        <CloseIconContainer className="col-1 is-vertical-align is-center" onClick={onClick}>
          <CloseIcon color="var(--failed-color)" />
        </CloseIconContainer>
      </StyledErrorAlert>
    </div>
  )
}
