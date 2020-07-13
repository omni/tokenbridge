import React, { useState, FormEvent } from 'react'
import styled from 'styled-components'
import { FormSubmitParams } from './MainPage'
import { Button } from './commons/Button'
import { TransactionSelector } from './TransactionSelector'
import { TransactionReceipt } from 'web3-eth'

const LabelText = styled.label`
  line-height: 36px;
  max-width: 140px;
`

const Input = styled.input`
  background-color: var(--bg-color);
  color: var(--font-color);
  max-width: 100%;
  border-color: var(--color-primary) !important;
  &:hover,
  &:active,
  &:focus {
    border-color: var(--button-color) !important;
  }
`

export const Form = ({ onSubmit }: { onSubmit: ({ chainId, txHash, receipt }: FormSubmitParams) => void }) => {
  const [txHash, setTxHash] = useState('')
  const [searchTx, setSearchTx] = useState(false)

  const formSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSearchTx(true)
  }

  const onSelected = (chainId: number, receipt: TransactionReceipt) => {
    onSubmit({ chainId, txHash, receipt })
  }

  const onBack = () => {
    setTxHash('')
    setSearchTx(false)
  }

  if (searchTx) {
    return <TransactionSelector txHash={txHash} onSelected={onSelected} onBack={onBack} />
  }

  return (
    <form onSubmit={formSubmit}>
      <div className="row is-center">
        <LabelText className="col-2">Bridgeable tx hash:</LabelText>
        <div className="col-7">
          <Input
            placeholder="Enter transaction hash"
            type="text"
            onChange={e => setTxHash(e.target.value)}
            required
            pattern="^0x[a-fA-F0-9]{64}$"
            value={txHash}
          />
        </div>
        <div className="col-1">
          <Button className="button outline" type="submit">
            Check
          </Button>
        </div>
      </div>
    </form>
  )
}
