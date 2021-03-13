import { useEffect, useState } from 'react'
import { TransactionReceipt } from 'web3-eth'
import { useStateProvider } from '../state/StateProvider'
import { Contract } from 'web3-eth-contract'
import { getRequiredBlockConfirmations } from '../utils/contract'
import { foreignSnapshotProvider, homeSnapshotProvider, SnapshotProvider } from '../services/SnapshotProvider'
import Web3 from 'web3'
import { FOREIGN_EXPLORER_API, HOME_EXPLORER_API } from '../config/constants'

export interface UseBlockConfirmationsParams {
  fromHome: boolean
  receipt: Maybe<TransactionReceipt>
}

export const useBlockConfirmations = ({ receipt, fromHome }: UseBlockConfirmationsParams) => {
  const [blockConfirmations, setBlockConfirmations] = useState(0)

  const { home, foreign } = useStateProvider()

  const callRequireBlockConfirmations = async (
    contract: Contract,
    receipt: TransactionReceipt,
    setResult: Function,
    snapshotProvider: SnapshotProvider,
    web3: Web3,
    api: string
  ) => {
    const result = await getRequiredBlockConfirmations(contract, receipt.blockNumber, snapshotProvider, web3, api)
    setResult(result)
  }

  useEffect(
    () => {
      const bridgeContract = fromHome ? home.bridgeContract : foreign.bridgeContract
      const snapshotProvider = fromHome ? homeSnapshotProvider : foreignSnapshotProvider
      const web3 = fromHome ? home.web3 : foreign.web3
      const api = fromHome ? HOME_EXPLORER_API : FOREIGN_EXPLORER_API
      if (!bridgeContract || !receipt || !web3) return
      callRequireBlockConfirmations(bridgeContract, receipt, setBlockConfirmations, snapshotProvider, web3, api)
    },
    [home.bridgeContract, foreign.bridgeContract, receipt, fromHome, home.web3, foreign.web3]
  )

  return {
    blockConfirmations
  }
}
