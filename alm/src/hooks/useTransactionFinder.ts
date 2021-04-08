import { useEffect, useState } from 'react'
import { TransactionReceipt } from 'web3-eth'
import { HOME_RPC_POLLING_INTERVAL, TRANSACTION_STATUS } from '../config/constants'
import Web3 from 'web3'

export const useTransactionFinder = ({ txHash, web3 }: { txHash: string; web3: Maybe<Web3> }) => {
  const [status, setStatus] = useState(TRANSACTION_STATUS.UNDEFINED)
  const [receipt, setReceipt] = useState<Maybe<TransactionReceipt>>(null)

  useEffect(
    () => {
      if (!txHash || !web3) return

      let timeoutId: number

      const getReceipt = async () => {
        const txReceipt = await web3.eth.getTransactionReceipt(txHash)
        setReceipt(txReceipt)

        if (!txReceipt) {
          setStatus(TRANSACTION_STATUS.NOT_FOUND)
          timeoutId = setTimeout(getReceipt, HOME_RPC_POLLING_INTERVAL)
        } else {
          setStatus(TRANSACTION_STATUS.FOUND)
        }
      }

      getReceipt()

      return () => clearTimeout(timeoutId)
    },
    [txHash, web3]
  )

  return {
    status,
    receipt
  }
}
