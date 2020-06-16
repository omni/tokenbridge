import styled from 'styled-components'

export const SuccessLabel = styled.label`
  color: var(--success-color);
  background-color: var(--success-bg-color);
  padding: 0.4rem 0.7rem;
  border-radius: 4px;
`

export const GreyLabel = styled.label`
  color: var(--not-required-color);
  background-color: var(--not-required-bg-color);
  padding: 0.4rem 0.7rem;
  border-radius: 4px;
`

export const RedLabel = styled.label`
  color: var(--failed-color);
  background-color: var(--failed-bg-color);
  padding: 0.4rem 0.7rem;
  border-radius: 4px;
`
