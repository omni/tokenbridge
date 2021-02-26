import { useEffect, useState } from 'react'
import { TransactionReceipt } from 'web3-eth'
import { useStateProvider } from '../state/StateProvider'
import { FOREIGN_EXPLORER_API, HOME_EXPLORER_API } from '../config/constants'
import { getClosestBlockByTimestamp } from '../utils/explorer'

export function useClosestBlock(
  searchHome: boolean,
  fromHome: boolean,
  receipt: Maybe<TransactionReceipt>,
  timestamp: number
) {
  const { home, foreign } = useStateProvider()
  const [blockNumber, setBlockNumber] = useState<number | null>(null)

  useEffect(
    () => {
      if (!receipt || blockNumber || !timestamp) return

      if (fromHome === searchHome) {
        setBlockNumber(receipt.blockNumber)
        return
      }

      const web3 = searchHome ? home.web3 : foreign.web3
      if (!web3) return

      const getBlock = async () => {
        // try to fast-fetch closest block number from the chain explorer
        try {
          const api = searchHome ? HOME_EXPLORER_API : FOREIGN_EXPLORER_API
          setBlockNumber(await getClosestBlockByTimestamp(api, timestamp))
          return
        } catch {}

        const lastBlock = await web3.eth.getBlock('latest')
        if (lastBlock.timestamp <= timestamp) {
          setBlockNumber(lastBlock.number)
          return
        }

        const oldBlock = await web3.eth.getBlock(Math.max(lastBlock.number - 10000, 1))
        const blockDiff = lastBlock.number - oldBlock.number
        const timeDiff = (lastBlock.timestamp as number) - (oldBlock.timestamp as number)
        const averageBlockTime = timeDiff / blockDiff
        let currentBlock = lastBlock

        let prevBlockDiff = Infinity
        while (true) {
          const timeDiff = (currentBlock.timestamp as number) - timestamp
          const blockDiff = Math.ceil(timeDiff / averageBlockTime)
          if (Math.abs(blockDiff) < 5 || Math.abs(blockDiff) >= Math.abs(prevBlockDiff)) {
            setBlockNumber(currentBlock.number - blockDiff - 5)
            break
          }

          prevBlockDiff = blockDiff
          currentBlock = await web3.eth.getBlock(currentBlock.number - blockDiff)
        }
      }

      getBlock()
    },
    [blockNumber, foreign.web3, fromHome, home.web3, receipt, searchHome, timestamp]
  )

  return blockNumber
}
