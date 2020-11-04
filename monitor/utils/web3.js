require('dotenv').config()
const Web3 = require('web3')

const { COMMON_HOME_RPC_URL, COMMON_FOREIGN_RPC_URL } = process.env

const homeProvider = new Web3.providers.HttpProvider(COMMON_HOME_RPC_URL)
const web3Home = new Web3(homeProvider)

const foreignProvider = new Web3.providers.HttpProvider(COMMON_FOREIGN_RPC_URL)
const web3Foreign = new Web3(foreignProvider)

function blockNumberWrapper(web3) {
  let blockNumber = null
  return async () => {
    if (!blockNumber) {
      blockNumber = await web3.eth.getBlockNumber()
    }
    return blockNumber
  }
}

module.exports = {
  web3Home,
  web3Foreign,
  getHomeBlockNumber: blockNumberWrapper(web3Home),
  getForeignBlockNumber: blockNumberWrapper(web3Foreign)
}
