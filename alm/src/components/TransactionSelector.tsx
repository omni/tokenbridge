import React, { useEffect } from 'react'
import { useTransactionFinder } from '../hooks/useTransactionFinder'
import { useStateProvider } from '../state/StateProvider'
import { TRANSACTION_STATUS } from '../config/constants'
import { TransactionReceipt } from 'web3-eth'
import { Loading } from './commons/Loading'
import { NetworkTransactionSelector } from './NetworkTransactionSelector'
import { BackButton } from './commons/BackButton'
import { TRANSACTION_STATUS_DESCRIPTION } from '../config/descriptions'
import { MultiLine } from './commons/MultiLine'
import styled from 'styled-components'

const StyledMultiLine = styled(MultiLine)`
  margin-bottom: 40px;
`

export const TransactionSelector = ({
  txHash,
  onSelected,
  onBack
}: {
  txHash: string
  onSelected: (chainId: number, receipt: TransactionReceipt) => void
  onBack: () => void
}) => {
  const { home, foreign } = useStateProvider()
  const { receipt: homeReceipt, status: homeStatus } = useTransactionFinder({ txHash, web3: home.web3 })
  const { receipt: foreignReceipt, status: foreignStatus } = useTransactionFinder({ txHash, web3: foreign.web3 })

  useEffect(
    () => {
      if (!home.chainId || !foreign.chainId) return
      if (homeStatus === TRANSACTION_STATUS.FOUND && foreignStatus === TRANSACTION_STATUS.NOT_FOUND) {
        if (!homeReceipt) return
        onSelected(home.chainId, homeReceipt)
      } else if (foreignStatus === TRANSACTION_STATUS.FOUND && homeStatus === TRANSACTION_STATUS.NOT_FOUND) {
        if (!foreignReceipt) return
        onSelected(foreign.chainId, foreignReceipt)
      }
    },
    [homeReceipt, homeStatus, foreignReceipt, foreignStatus, home.chainId, foreign.chainId, onSelected]
  )

  const onSelectedNetwork = (chainId: number) => {
    const chain = chainId === home.chainId ? home.chainId : foreign.chainId
    const receipt = chainId === home.chainId ? homeReceipt : foreignReceipt

    if (!receipt) return
    onSelected(chain, receipt)
  }

  if (foreignStatus === TRANSACTION_STATUS.FOUND && homeStatus === TRANSACTION_STATUS.FOUND) {
    return <NetworkTransactionSelector onNetworkSelected={onSelectedNetwork} />
  }

  if (foreignStatus === TRANSACTION_STATUS.NOT_FOUND && homeStatus === TRANSACTION_STATUS.NOT_FOUND) {
    const message = TRANSACTION_STATUS_DESCRIPTION[TRANSACTION_STATUS.NOT_FOUND]
    return (
      <div>
        <StyledMultiLine>{message}</StyledMultiLine>
        <BackButton onBackToMain={onBack} />
      </div>
    )
  }

  return <Loading />
}
