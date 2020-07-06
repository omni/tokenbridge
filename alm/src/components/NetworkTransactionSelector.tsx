import React, { useState } from 'react'
import { Button } from './commons/Button'
import { RadioButtonLabel, RadioButtonContainer } from './commons/RadioButton'
import { useStateProvider } from '../state/StateProvider'

export const NetworkTransactionSelector = ({ onNetworkSelected }: { onNetworkSelected: (chainId: number) => void }) => {
  const { home, foreign } = useStateProvider()
  const [chainId, setChainId] = useState(home.chainId)

  const networks = [home, foreign]

  const onSelect = () => {
    onNetworkSelected(chainId)
  }

  return (
    <div>
      <p>The transaction was found in both networks, please select one:</p>
      <div className="row is-center">
        <div className="col-3-lg col-12 is-marginless">
          {networks.map((network, i) => (
            <RadioButtonContainer
              className="row is-center is-vertical-align"
              key={i}
              onClick={() => setChainId(network.chainId)}
            >
              <input
                className="is-marginless"
                type="radio"
                name="message"
                value={network.chainId}
                checked={network.chainId === chainId}
                onChange={() => setChainId(network.chainId)}
              />
              <RadioButtonLabel htmlFor={i.toString()}>{network.name}</RadioButtonLabel>
            </RadioButtonContainer>
          ))}
        </div>
        <div className="col-3-lg col-12 is-marginless">
          <Button className="button outline" onClick={onSelect}>
            Select
          </Button>
        </div>
      </div>
    </div>
  )
}
