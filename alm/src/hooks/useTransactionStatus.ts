import { useEffect, useState } from 'react'
import { TransactionReceipt } from 'web3-eth'
import { HOME_RPC_POLLING_INTERVAL, TRANSACTION_STATUS } from '../config/constants'
import { getTransactionStatusDescription } from '../utils/networks'
import { useStateProvider } from '../state/StateProvider'
import { getHomeMessagesFromReceipt, getForeignMessagesFromReceipt, MessageObject, getBlock } from '../utils/web3'
import useInterval from '@use-it/interval'

export const useTransactionStatus = ({
  txHash,
  chainId,
  receiptParam
}: {
  txHash: string
  chainId: number
  receiptParam: Maybe<TransactionReceipt>
}) => {
  const { home, foreign } = useStateProvider()
  const [messages, setMessages] = useState<Array<MessageObject>>([])
  const [status, setStatus] = useState('')
  const [description, setDescription] = useState('')
  const [receipt, setReceipt] = useState<Maybe<TransactionReceipt>>(null)
  const [timestamp, setTimestamp] = useState(0)
  const [loading, setLoading] = useState(true)

  // Update description so the time displayed is accurate
  useInterval(() => {
    if (!status || !timestamp || !description) return
    setDescription(getTransactionStatusDescription(status, timestamp))
  }, 30000)

  useEffect(
    () => {
      if (!chainId || !txHash || !home.chainId || !foreign.chainId || !home.web3 || !foreign.web3) return
      const isHome = chainId === home.chainId
      const web3 = isHome ? home.web3 : foreign.web3

      let timeoutId: number

      const getReceipt = async () => {
        setLoading(true)

        let txReceipt

        if (receiptParam) {
          txReceipt = receiptParam
        } else {
          txReceipt = await web3.eth.getTransactionReceipt(txHash)
        }

        setReceipt(txReceipt)

        if (!txReceipt) {
          setStatus(TRANSACTION_STATUS.NOT_FOUND)
          setDescription(getTransactionStatusDescription(TRANSACTION_STATUS.NOT_FOUND))
          setMessages([{ id: txHash, data: '' }])
          timeoutId = window.setTimeout(() => getReceipt(), HOME_RPC_POLLING_INTERVAL)
        } else {
          const blockNumber = txReceipt.blockNumber
          const block = await getBlock(web3, blockNumber)
          const blockTimestamp = typeof block.timestamp === 'string' ? parseInt(block.timestamp) : block.timestamp
          setTimestamp(blockTimestamp)

          if (txReceipt.status) {
            let bridgeMessages: Array<MessageObject>
            if (isHome) {
              bridgeMessages = getHomeMessagesFromReceipt(txReceipt, web3, home.bridgeAddress)
            } else {
              bridgeMessages = getForeignMessagesFromReceipt(txReceipt, web3, foreign.bridgeAddress)
            }

            if (bridgeMessages.length === 0) {
              setMessages([{ id: txHash, data: '' }])
              setStatus(TRANSACTION_STATUS.SUCCESS_NO_MESSAGES)
              setDescription(getTransactionStatusDescription(TRANSACTION_STATUS.SUCCESS_NO_MESSAGES, blockTimestamp))
            } else if (bridgeMessages.length === 1) {
              setMessages(bridgeMessages)
              setStatus(TRANSACTION_STATUS.SUCCESS_ONE_MESSAGE)
              setDescription(getTransactionStatusDescription(TRANSACTION_STATUS.SUCCESS_ONE_MESSAGE, blockTimestamp))
            } else {
              setMessages(bridgeMessages)
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
        setLoading(false)
      }

      getReceipt()

      return () => clearTimeout(timeoutId)
    },
    [
      txHash,
      chainId,
      home.chainId,
      foreign.chainId,
      home.web3,
      foreign.web3,
      home.bridgeAddress,
      foreign.bridgeAddress,
      receiptParam
    ]
  )

  return {
    messages,
    status,
    description,
    receipt,
    timestamp,
    loading
  }
}
