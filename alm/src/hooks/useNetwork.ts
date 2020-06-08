import { useEffect, useState } from 'react'
import { getNetworkName } from '../utils/networks'
import { getWeb3 } from '../utils/web3'

export const useNetwork = (url: string) => {
  const [loading, setLoading] = useState(true)
  const [chainId, setChainId] = useState(0)
  const [networkName, setNetworkName] = useState('')
  const web3 = getWeb3(url)

  useEffect(
    () => {
      setLoading(true)
      const getChainId = async () => {
        const id = await web3.eth.getChainId()
        const name = getNetworkName(id)
        setChainId(id)
        setNetworkName(name)
        setLoading(false)
      }
      getChainId()
    },
    [web3.eth]
  )

  return {
    web3,
    chainId,
    name: networkName,
    loading
  }
}
