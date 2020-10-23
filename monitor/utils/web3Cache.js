const fs = require('fs')
const Web3 = require('web3')
const logger = require('../logger')('web3Cache')

const { COMMON_HOME_RPC_URL } = process.env

const homeProvider = new Web3.providers.HttpProvider(COMMON_HOME_RPC_URL)
const web3Home = new Web3(homeProvider)

let isChanged = false

const homeTxSendersCacheFile = './cache/homeTxSenders.json'
let cachedHomeTxSenders
try {
  cachedHomeTxSenders = JSON.parse(fs.readFileSync(homeTxSendersCacheFile))
} catch (_) {
  cachedHomeTxSenders = {}
}

async function getHomeTxSender(txHash) {
  if (!cachedHomeTxSenders[txHash]) {
    logger.debug(`Fetching sender for tx ${txHash}`)
    cachedHomeTxSenders[txHash] = (await web3Home.eth.getTransaction(txHash)).from.toLowerCase()
    isChanged = true
  }
  return cachedHomeTxSenders[txHash]
}

function saveCache() {
  if (isChanged) {
    logger.debug('Saving cache on disk')
    fs.writeFileSync(homeTxSendersCacheFile, JSON.stringify(cachedHomeTxSenders))
  }
}

module.exports = {
  getHomeTxSender,
  saveCache
}
