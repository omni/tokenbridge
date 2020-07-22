import { useEffect, useState } from 'react'
import { getChainId, getWeb3 } from '../utils/web3'
import { SnapshotProvider } from '../services/SnapshotProvider'

export const useNetwork = (url: string, snapshotProvider: SnapshotProvider) => {
  const [loading, setLoading] = useState(true)
  const [chainId, setChainId] = useState(0)
  const web3 = getWeb3(url)

  useEffect(
    () => {
      setLoading(true)
      const getWeb3ChainId = async () => {
        const id = await getChainId(web3, snapshotProvider)
        setChainId(id)
        setLoading(false)
      }
      getWeb3ChainId()
    },
    [web3, snapshotProvider]
  )

  return {
    web3,
    chainId,
    loading
  }
}
