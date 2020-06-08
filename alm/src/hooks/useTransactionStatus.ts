import { useEffect, useState } from 'react'
import { TransactionReceipt } from 'web3-eth'
import { TRANSACTION_STATUS } from '../config/constants'
import { getTransactionStatusDescription } from '../utils/networks'
import { useStateProvider } from '../state/StateProvider'
import { getHomeMessagesFromReceipt, getForeignMessagesFromReceipt } from '../utils/web3'

export const useTransactionStatus = ({ txHash, chainId }: { txHash: string; chainId: number }) => {
  const { home, foreign } = useStateProvider()
  const [messagesId, setMessagesId] = useState<Array<string>>([])
  const [status, setStatus] = useState('')
  const [description, setDescription] = useState('')
  const [receipt, setReceipt] = useState<Maybe<TransactionReceipt>>(null)
  const [timestamp, setTimestamp] = useState(0)

  useEffect(
    () => {
      const subscriptions: Array<number> = []

      const unsubscribe = () => {
        subscriptions.forEach(s => {
          clearTimeout(s)
        })
      }

      const getReceipt = async () => {
        if (!chainId || !txHash || !home.chainId || !foreign.chainId || !home.web3 || !foreign.web3) return

        const isHome = chainId === home.chainId
        const web3 = isHome ? home.web3 : foreign.web3

        const txReceipt = await web3.eth.getTransactionReceipt(txHash)
        setReceipt(txReceipt)

        if (!txReceipt) {
          setMessagesId([txHash])
          setStatus(TRANSACTION_STATUS.NOT_FOUND)
          setDescription(getTransactionStatusDescription(TRANSACTION_STATUS.NOT_FOUND))
          const timeoutId = setTimeout(() => getReceipt(), 5000)
          subscriptions.push(timeoutId)
        } else {
          const blockNumber = txReceipt.blockNumber
          const block = await web3.eth.getBlock(blockNumber)
          const blockTimestamp = typeof block.timestamp === 'string' ? parseInt(block.timestamp) : block.timestamp
          setTimestamp(blockTimestamp)

          if (txReceipt.status) {
            let bridgeMessagesId
            if (isHome) {
              bridgeMessagesId = getHomeMessagesFromReceipt(txReceipt, home.web3, home.bridgeAddress)
            } else {
              bridgeMessagesId = getForeignMessagesFromReceipt(txReceipt, foreign.web3, foreign.bridgeAddress)
            }

            if (bridgeMessagesId.length === 0) {
              setMessagesId([txHash])
              setStatus(TRANSACTION_STATUS.SUCCESS_NO_MESSAGES)
              setDescription(getTransactionStatusDescription(TRANSACTION_STATUS.SUCCESS_NO_MESSAGES, blockTimestamp))
            } else if (bridgeMessagesId.length === 1) {
              setMessagesId(bridgeMessagesId)
              setStatus(TRANSACTION_STATUS.SUCCESS_ONE_MESSAGE)
              setDescription(getTransactionStatusDescription(TRANSACTION_STATUS.SUCCESS_ONE_MESSAGE, blockTimestamp))
            } else {
              setMessagesId(bridgeMessagesId)
              setStatus(TRANSACTION_STATUS.SUCCESS_MULTIPLE_MESSAGES)
              setDescription(
                getTransactionStatusDescription(TRANSACTION_STATUS.SUCCESS_MULTIPLE_MESSAGES, blockTimestamp)
              )
            }
          } else {
            setStatus(TRANSACTION_STATUS.FAILED)
            setDescription(getTransactionStatusDescription(TRANSACTION_STATUS.FAILED, blockTimestamp))
          }
        }
      }

      // unsubscribe from previous txHash
      unsubscribe()

      getReceipt()
      return () => {
        // unsubscribe when unmount component
        unsubscribe()
      }
    },
    [txHash, chainId, home.chainId, foreign.chainId, home.web3, foreign.web3, home.bridgeAddress, foreign.bridgeAddress]
  )

  return {
    messagesId,
    status,
    description,
    receipt,
    timestamp
  }
}
