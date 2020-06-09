import { useEffect, useState } from 'react'
import { getWeb3 } from '../utils/web3'

export const useNetwork = (url: string) => {
  const [loading, setLoading] = useState(true)
  const [chainId, setChainId] = useState(0)
  const web3 = getWeb3(url)

  useEffect(
    () => {
      setLoading(true)
      const getChainId = async () => {
        const id = await web3.eth.getChainId()
        setChainId(id)
        setLoading(false)
      }
      getChainId()
    },
    [web3.eth]
  )

  return {
    web3,
    chainId,
    loading
  }
}
