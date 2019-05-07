const HttpListProvider = require('http-list-provider')
const Web3 = require('web3')
const rpcUrlsManager = require('./getRpcUrlsManager')
const { RETRY_CONFIG } = require('../utils/constants')

const homeProvider = new HttpListProvider(rpcUrlsManager.homeUrls, {
  retry: RETRY_CONFIG
})
const web3Home = new Web3(homeProvider)

const foreignProvider = new HttpListProvider(rpcUrlsManager.foreignUrls, {
  retry: RETRY_CONFIG
})
const web3Foreign = new Web3(foreignProvider)

module.exports = {
  web3Home,
  web3Foreign
}
