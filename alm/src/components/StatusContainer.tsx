import React from 'react'
import { useParams } from 'react-router-dom'
import { useStateProvider } from '../state/StateProvider'

export const StatusContainer = () => {
  const { networkId, txHash } = useParams()
  const { home, foreign } = useStateProvider()

  return (
    <div>
      <p>
        Hello! {networkId} - {txHash}
      </p>
      <p>
        home: {home.name} - {home.chainId}
      </p>
      <p>
        foreign: {foreign.name} - {foreign.chainId}
      </p>
    </div>
  )
}
