import { useEffect, useState } from 'react'
import { getNetworkName } from '../utils/networks'
import { getWeb3 } from '../utils/web3'

export const useNetwork = (url: string) => {
  const [chainId, setChainId] = useState(0)
  const [networkName, setNetworkName] = useState('')
  const web3 = getWeb3(url)

  useEffect(
    () => {
      const getChainId = async () => {
        const id = await web3.eth.getChainId()
        const name = getNetworkName(id)
        setChainId(id)
        setNetworkName(name)
      }
      getChainId()
    },
    [web3.eth]
  )

  return {
    web3,
    chainId,
    name: networkName
  }
}
