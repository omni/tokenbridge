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

      const subscriptions: number[] = []

      const unsubscribe = () => {
        subscriptions.forEach(s => {
          clearTimeout(s)
        })
      }

      const getReceipt = async (
        web3: Web3,
        txHash: string,
        setReceipt: Function,
        setStatus: Function,
        subscriptions: number[]
      ) => {
        const txReceipt = await web3.eth.getTransactionReceipt(txHash)
        setReceipt(txReceipt)

        if (!txReceipt) {
          setStatus(TRANSACTION_STATUS.NOT_FOUND)
          const timeoutId = setTimeout(
            () => getReceipt(web3, txHash, setReceipt, setStatus, subscriptions),
            HOME_RPC_POLLING_INTERVAL
          )
          subscriptions.push(timeoutId)
        } else {
          setStatus(TRANSACTION_STATUS.FOUND)
        }
      }

      getReceipt(web3, txHash, setReceipt, setStatus, subscriptions)
      return () => {
        unsubscribe()
      }
    },
    [txHash, web3]
  )

  return {
    status,
    receipt
  }
}
