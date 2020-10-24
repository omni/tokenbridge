const logger = require('../logger')('web3Cache')
const { readCacheFile, writeFile } = require('./file')
const { web3Home } = require('./web3')

let isDirty = false

const homeTxSendersCacheFile = './cache/homeTxSenders.json'
const cachedHomeTxSenders = readCacheFile(homeTxSendersCacheFile) || {}

async function getHomeTxSender(txHash) {
  if (!cachedHomeTxSenders[txHash]) {
    logger.debug(`Fetching sender for tx ${txHash}`)
    cachedHomeTxSenders[txHash] = (await web3Home.eth.getTransaction(txHash)).from.toLowerCase()
    isDirty = true
  }
  return cachedHomeTxSenders[txHash]
}

function saveCache() {
  if (isDirty) {
    logger.debug('Saving cache on disk')
    writeFile(homeTxSendersCacheFile, cachedHomeTxSenders)
  }
}

module.exports = {
  getHomeTxSender,
  saveCache
}
