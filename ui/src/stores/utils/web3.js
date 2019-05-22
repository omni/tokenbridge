import Web3 from 'web3'
import { fromWei, toHex } from 'web3-utils'

const updateTitle = (networkName = 'No chain specified') => {
  const defaultTitle = 'TokenBridge UI app'
  if (!process.env.REACT_APP_TITLE) {
    document.title = defaultTitle
  } else {
    const titleReplaceString = '%c'
    let appTitle = process.env.REACT_APP_TITLE || defaultTitle

    if (appTitle.indexOf(titleReplaceString) !== -1) {
      document.title = appTitle.replace(titleReplaceString, networkName)
    } else {
      document.title = appTitle
    }
  }
}

const getWeb3 = () => {
  return new Promise(function(resolve, reject) {
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    window.addEventListener('load', async function() {
      let web3 = window.web3
      const { ethereum } = window

      updateTitle()

      if (ethereum) {
        web3 = new Web3(ethereum)
        try {
          // Request account access
          await ethereum.enable()
          await processWeb3(web3, resolve, reject)
        } catch (error) {
          console.log(error)
          const errorMsg = `Wallet account rejected by user. You need to unlock your wallet.
           Please refresh the page and click 'Connect' button in your wallet popup.`
          reject({ type: 'rejected', message: errorMsg })
        }
      } else if (typeof web3 !== 'undefined') {
        web3 = new Web3(web3.currentProvider)
        await processWeb3(web3, resolve, reject)
      } else {
        // Fallback to localhost if no web3 injection.
        const errorMsg = ''
        reject({ type: 'install', message: errorMsg })
        console.log('No web3 instance injected, using Local web3.')
        console.error('wallet not found')
      }
    })
  })
}

export default getWeb3

const networks = {
  1: 'Ethereum Mainnet',
  3: 'Ropsten',
  4: 'Rinkeby',
  30: 'RSK Mainnet',
  31: 'RSK Testnet',
  42: 'Kovan',
  61: 'Ethereum Classic',
  77: 'Sokol',
  99: 'POA Network',
  100: 'Dai Chain'
}

export const getNetworkName = id => networks[id] || 'Unknown'

export const getBalance = async (web3, address) => {
  const balance = await web3.eth.getBalance(address)
  return fromWei(balance)
}

export const getWeb3Instance = provider => {
  const web3Provider = new Web3.providers.HttpProvider(provider)
  return new Web3(web3Provider)
}

export const getNetwork = async web3 => {
  const id = await web3.eth.getChainId()
  const name = getNetworkName(id)
  return {
    id,
    name
  }
}

export const getBlockNumber = web3 => web3.eth.getBlockNumber()

export const estimateGas = async (web3, to, gasPrice, from, value, data) => {
  const gas = await web3.eth.estimateGas({ to, gasPrice, from, value, data })
  return toHex(gas.toString())
}

const processWeb3 = async (web3, resolve, reject) => {
  let netId
  try {
    netId = await web3.eth.getChainId()
  } catch (error) {
    reject({
      type: 'unlock',
      message:
        'Wallet does not support getting the Chain ID. Please use another wallet or specify a RPC url of a node that supports eth_chainId call'
    })
  }
  const netIdName = getNetworkName(netId)

  console.log(`This is ${netIdName} network.`, netId)

  const accounts = await web3.eth.getAccounts()
  const defaultAccount = accounts[0] || null

  if (defaultAccount === null) {
    reject({ type: 'unlock', message: 'Please unlock your wallet and refresh the page' })
  }

  updateTitle(netIdName)

  const results = {
    web3Instance: new Web3(web3.currentProvider),
    netIdName,
    netId,
    injectedWeb3: true,
    defaultAccount
  }
  resolve(results)
}
