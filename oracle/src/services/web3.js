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

const redundantHomeProvider = new RedundantHttpListProvider(homeUrls, homeOptions)
const web3HomeRedundant = new Web3(redundantHomeProvider)

const redundantForeignProvider = new RedundantHttpListProvider(foreignUrls, foreignOptions)
const web3ForeignRedundant = new Web3(redundantForeignProvider)

module.exports = {
  web3Home,
  web3Foreign,
  web3HomeRedundant,
  web3ForeignRedundant
}
