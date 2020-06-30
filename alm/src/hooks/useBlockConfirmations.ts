import { useEffect, useState } from 'react'
import { TransactionReceipt } from 'web3-eth'
import { useStateProvider } from '../state/StateProvider'
import { Contract } from 'web3-eth-contract'
import { getRequiredBlockConfirmations } from '../utils/contract'

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
    setResult: Function
  ) => {
    const result = await getRequiredBlockConfirmations(contract, receipt.blockNumber)
    setResult(result)
  }

  useEffect(
    () => {
      const bridgeContract = fromHome ? home.bridgeContract : foreign.bridgeContract
      if (!bridgeContract || !receipt) return
      callRequireBlockConfirmations(bridgeContract, receipt, setBlockConfirmations)
    },
    [home.bridgeContract, foreign.bridgeContract, receipt, fromHome]
  )

  return {
    blockConfirmations
  }
}
