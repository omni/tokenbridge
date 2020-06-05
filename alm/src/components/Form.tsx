import React, { useState, FormEvent, useEffect } from 'react'
import styled from 'styled-components'
import { FormSubmitParams } from './MainPage'
import { useStateProvider } from '../state/StateProvider'
import { useParams } from 'react-router-dom'

const LabelText = styled.label`
  line-height: 36px;
  max-width: 140px;
`

const Button = styled.button`
  height: 36px;
`

const RadioButtonContainer = styled.div`
  padding: 10px;
`

export const Form = ({ onSubmit }: { onSubmit: ({ chainId, txHash }: FormSubmitParams) => void }) => {
  const { home, foreign } = useStateProvider()
  const { chainId: paramChainId, txHash: paramTxHash } = useParams()
  const [chainId, setChainId] = useState(0)
  const [txHash, setTxHash] = useState('')

  useEffect(
    () => {
      if (!paramChainId) {
        setChainId(foreign.chainId)
      } else {
        setChainId(parseInt(paramChainId))
        setTxHash(paramTxHash)
      }
    },
    [foreign.chainId, paramChainId, paramTxHash]
  )

  const formSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ chainId, txHash })
  }

  return (
    <form onSubmit={formSubmit}>
      <div className="row is-center">
        <LabelText className="col-2">Bridgeable tx hash:</LabelText>
        <div className="col-7">
          <input
            type="text"
            onChange={e => setTxHash(e.target.value)}
            required
            pattern="^0x[a-fA-F0-9]{64}$"
            value={txHash}
          />
        </div>
        <div className="col-1">
          <Button className="button dark" type="submit">
            Check
          </Button>
        </div>
      </div>
      <div className="row is-center">
        <RadioButtonContainer onClick={() => setChainId(foreign.chainId)}>
          <input
            type="radio"
            name="network"
            value={foreign.name}
            checked={chainId === foreign.chainId}
            onChange={() => setChainId(foreign.chainId)}
          />
          <label htmlFor={foreign.name}>{foreign.name}</label>
        </RadioButtonContainer>
        <RadioButtonContainer onClick={() => setChainId(home.chainId)}>
          <input
            type="radio"
            name="network"
            value={home.name}
            checked={chainId === home.chainId}
            onChange={() => setChainId(home.chainId)}
          />
          <label htmlFor={home.name}>{home.name}</label>
        </RadioButtonContainer>
      </div>
    </form>
  )
}
