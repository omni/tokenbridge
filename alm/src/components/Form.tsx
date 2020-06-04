import React, { useState, FormEvent } from 'react'
import styled from 'styled-components'
import { FormSubmitParams } from './MainPage'
import { useStateProvider } from '../state/StateProvider'

const LabelText = styled.label`
  text-align: end;
  line-height: 36px;
`

const Button = styled.button`
  height: 36px;
`

const RadioButtonContainer = styled.div`
  padding: 10px;
`

export const Form = ({ onSubmit }: { onSubmit: ({ networkId, txHash }: FormSubmitParams) => void }) => {
  const { home, foreign } = useStateProvider()
  const [networkId, setNetworkId] = useState(1)
  const [txHash, setTxHash] = useState('')

  const formSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ networkId, txHash })
  }

  return (
    <form onSubmit={formSubmit}>
      <div className="row is-center">
        <LabelText className="col-2">Bridgeable tx hash:</LabelText>
        <div className="col-7">
          <input type="text" onChange={e => setTxHash(e.target.value)} required pattern="^0x[a-fA-F0-9]{64}$" />
        </div>
        <div className="col-1">
          <Button className="button dark" type="submit">
            Check
          </Button>
        </div>
      </div>
      <div className="row is-center">
        <RadioButtonContainer onClick={() => setNetworkId(foreign.chainId)}>
          <input
            type="radio"
            name="network"
            value={foreign.name}
            checked={networkId === foreign.chainId}
            onChange={() => setNetworkId(foreign.chainId)}
          />
          <label htmlFor={foreign.name}>{foreign.name}</label>
        </RadioButtonContainer>
        <RadioButtonContainer onClick={() => setNetworkId(home.chainId)}>
          <input
            type="radio"
            name="network"
            value={home.name}
            checked={networkId === home.chainId}
            onChange={() => setNetworkId(home.chainId)}
          />
          <label htmlFor={home.name}>{home.name}</label>
        </RadioButtonContainer>
      </div>
    </form>
  )
}
