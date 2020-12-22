const Web3 = require('web3')
const { HttpListProvider } = require('./HttpListProvider')
const { RedundantHttpListProvider } = require('./RedundantHttpListProvider')
const { RETRY_CONFIG } = require('../utils/constants')

const {
  COMMON_HOME_RPC_URL,
  COMMON_FOREIGN_RPC_URL,
  ORACLE_RPC_REQUEST_TIMEOUT,
  ORACLE_HOME_RPC_POLLING_INTERVAL,
  ORACLE_FOREIGN_RPC_POLLING_INTERVAL
} = process.env

if (!COMMON_HOME_RPC_URL) {
  throw new Error(`Invalid homeUrls: '${COMMON_HOME_RPC_URL}'`)
}
if (!COMMON_FOREIGN_RPC_URL) {
  throw new Error(`Invalid foreignUrls: '${COMMON_FOREIGN_RPC_URL}'`)
}

const homeUrls = COMMON_HOME_RPC_URL.split(' ').filter(url => url.length > 0)
const foreignUrls = COMMON_FOREIGN_RPC_URL.split(' ').filter(url => url.length > 0)

const homeDefaultTimeout = parseInt(ORACLE_HOME_RPC_POLLING_INTERVAL, 10) * 2
const foreignDefaultTimeout = parseInt(ORACLE_FOREIGN_RPC_POLLING_INTERVAL, 10) * 2
const configuredTimeout = parseInt(ORACLE_RPC_REQUEST_TIMEOUT, 10)

const homeOptions = {
  requestTimeout: configuredTimeout || homeDefaultTimeout,
  retry: RETRY_CONFIG
}

const foreignOptions = {
  requestTimeout: configuredTimeout || foreignDefaultTimeout,
  retry: RETRY_CONFIG
}

const homeProvider = new HttpListProvider(homeUrls, homeOptions)
const web3Home = new Web3(homeProvider)

const foreignProvider = new HttpListProvider(foreignUrls, foreignOptions)
const web3Foreign = new Web3(foreignProvider)

// secondary fallback providers are intended to be used in places where
// it is more likely that RPC calls to the local non-archive nodes can fail
// e.g. for checking status of the old transaction via eth_getTransactionByHash
let web3HomeFallback = web3Home
let web3ForeignFallback = web3Foreign

// secondary redundant providers are intended to be used in places where
// the result of a single RPC request can be lost
// e.g. for sending transactions eth_sendRawTransaction
let web3HomeRedundant = web3Home
let web3ForeignRedundant = web3Foreign

if (homeUrls.length > 1) {
  const provider = new HttpListProvider(homeUrls, { ...homeOptions, name: 'fallback' })
  web3HomeFallback = new Web3(provider)
  const redundantProvider = new RedundantHttpListProvider(homeUrls, { ...homeOptions, name: 'redundant' })
  web3HomeRedundant = new Web3(redundantProvider)
}

if (foreignUrls.length > 1) {
  const provider = new HttpListProvider(foreignUrls, { ...foreignOptions, name: 'fallback' })
  web3ForeignFallback = new Web3(provider)
  const redundantProvider = new RedundantHttpListProvider(foreignUrls, { ...foreignOptions, name: 'redundant' })
  web3ForeignRedundant = new Web3(redundantProvider)
}

module.exports = {
  web3Home,
  web3Foreign,
  web3HomeRedundant,
  web3ForeignRedundant,
  web3HomeFallback,
  web3ForeignFallback
}
