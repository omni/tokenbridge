const logger = require('../logger')('web3Cache')
const { readCacheFile, writeCacheFile } = require('./file')
const { web3Home, web3Foreign } = require('./web3')
const { getPastEvents: commonGetPastEvents } = require('../../commons')

const { MONITOR_BRIDGE_NAME, MONITOR_CACHE_EVENTS } = process.env

let isDirty = false

const homeTxSendersCacheFile = `./cache/${MONITOR_BRIDGE_NAME}/home/txSenders.json`
const cachedHomeTxSenders = readCacheFile(homeTxSendersCacheFile) || {}
const foreignTxSendersCacheFile = `./cache/${MONITOR_BRIDGE_NAME}/foreign/txSenders.json`
const cachedForeignTxSenders = readCacheFile(foreignTxSendersCacheFile) || {}
const homeIsContractCacheFile = `./cache/${MONITOR_BRIDGE_NAME}/home/isContract.json`
const cachedHomeIsContract = readCacheFile(homeIsContractCacheFile) || {}
const foreignIsContractCacheFile = `./cache/${MONITOR_BRIDGE_NAME}/foreign/isContract.json`
const cachedForeignIsContract = readCacheFile(foreignIsContractCacheFile) || {}

async function getHomeTxSender(txHash) {
  if (!cachedHomeTxSenders[txHash]) {
    logger.debug(`Fetching sender for home tx ${txHash}`)
    cachedHomeTxSenders[txHash] = (await web3Home.eth.getTransaction(txHash)).from.toLowerCase()
    isDirty = true
  }
  return cachedHomeTxSenders[txHash]
}

async function getForeignTxSender(txHash) {
  if (!cachedForeignTxSenders[txHash]) {
    logger.debug(`Fetching sender for foreign tx ${txHash}`)
    cachedForeignTxSenders[txHash] = (await web3Foreign.eth.getTransaction(txHash)).from.toLowerCase()
    isDirty = true
  }
  return cachedForeignTxSenders[txHash]
}

async function isHomeContract(address) {
  if (typeof cachedHomeIsContract[address] !== 'boolean') {
    logger.debug(`Fetching home contract code size for tx ${address}`)
    cachedHomeIsContract[address] = (await web3Home.eth.getCode(address)).length > 2
    isDirty = true
  }
  return cachedHomeIsContract[address]
}

async function isForeignContract(address) {
  if (typeof cachedForeignIsContract[address] !== 'boolean') {
    logger.debug(`Fetching foreign contract code size for tx ${address}`)
    cachedForeignIsContract[address] = (await web3Foreign.eth.getCode(address)).length > 2
    isDirty = true
  }
  return cachedForeignIsContract[address]
}

async function getPastEvents(contract, options) {
  if (MONITOR_CACHE_EVENTS !== 'true') {
    return commonGetPastEvents(contract, options)
  }

  const contractAddr = contract.options.address

  let eventSignature
  if (options.event.includes('(')) {
    eventSignature = options.event
    options.event = web3Home.utils.sha3(eventSignature)
    const eventABI = contract.options.jsonInterface.find(e => e.type === 'event' && e.signature === options.event)
    if (!eventABI) {
      throw new Error(`Event ${eventSignature} not found`)
    }
  } else {
    const eventABI = contract.options.jsonInterface.find(
      e => e.type === 'event' && (e.name === options.event || e.signature === options.event)
    )
    if (!eventABI) {
      throw new Error(`Event ${options.event} not found`)
    }
    eventSignature = `${eventABI.name}(${eventABI.inputs.map(i => i.type).join(',')})`
  }

  const cacheFile = `./cache/${MONITOR_BRIDGE_NAME}/${options.chain}/${contractAddr}/${eventSignature}.json`

  const { fromBlock, toBlock } = options
  const { fromBlock: cachedFromBlock, toBlock: cachedToBlock, events: cachedEvents } = readCacheFile(cacheFile) || {
    fromBlock: 0,
    toBlock: 0,
    events: []
  }

  let result
  if (cachedFromBlock > toBlock || fromBlock > cachedToBlock) {
    // requested: A...B
    // cached:         C...D
    // OR
    // requested:      A...B
    // cached:    C...D
    logger.debug(`Fetching events for blocks ${fromBlock}...${toBlock}`)
    result = await commonGetPastEvents(contract, options)
  } else if (fromBlock < cachedFromBlock && toBlock <= cachedToBlock) {
    // requested: A...B
    // cached:      C...D
    logger.debug(`Cache hit for blocks ${cachedFromBlock}...${toBlock}`)
    logger.debug(`Fetching events for blocks ${fromBlock}...${cachedFromBlock - 1}`)
    result = [
      ...(await commonGetPastEvents(contract, { ...options, toBlock: cachedFromBlock - 1 })),
      ...cachedEvents.filter(e => e.blockNumber <= toBlock)
    ]
  } else if (fromBlock < cachedFromBlock && cachedToBlock < toBlock) {
    // requested: A.....B
    // cached:      C.D
    logger.debug(`Cache hit for blocks ${cachedFromBlock}...${cachedToBlock}`)
    logger.debug(`Fetching events for blocks ${fromBlock}...${cachedFromBlock - 1}`)
    logger.debug(`Fetching events for blocks ${cachedToBlock + 1}...${toBlock}`)
    result = [
      ...(await commonGetPastEvents(contract, { ...options, toBlock: cachedFromBlock - 1 })),
      ...cachedEvents,
      ...(await commonGetPastEvents(contract, { ...options, fromBlock: cachedToBlock + 1 }))
    ]
  } else if (cachedFromBlock <= fromBlock && toBlock <= cachedToBlock) {
    // requested:   A.B
    // cached:    C.....D
    logger.debug(`Cache hit for blocks ${fromBlock}...${toBlock}`)
    result = cachedEvents.filter(e => fromBlock <= e.blockNumber && e.blockNumber <= toBlock)
  } else if (fromBlock >= cachedFromBlock && toBlock > cachedToBlock) {
    // requested:   A...B
    // cached:    C...D
    logger.debug(`Cache hit for blocks ${fromBlock}...${cachedToBlock}`)
    logger.debug(`Fetching events for blocks ${cachedToBlock + 1}...${toBlock}`)
    result = [
      ...cachedEvents.filter(e => e.blockNumber >= fromBlock),
      ...(await commonGetPastEvents(contract, { ...options, fromBlock: cachedToBlock + 1 }))
    ]
  } else {
    throw new Error(
      `Something is broken with cache resolution for getPastEvents,
      requested blocks ${fromBlock}...${toBlock},
      cached blocks ${cachedFromBlock}...${cachedToBlock}`
    )
  }

  // it is not safe to cache events with too low block confirmations
  // so, only events from finalized blocks are included into the cache
  const safeToBlock = options.safeToBlock || toBlock
  const cacheToSave = result.filter(e => e.blockNumber <= safeToBlock)
  logger.debug(
    `Saving events cache for ${MONITOR_BRIDGE_NAME}/${options.chain}/${contractAddr}/${eventSignature} on disk`
  )
  writeCacheFile(cacheFile, {
    fromBlock,
    toBlock: safeToBlock,
    events: cacheToSave
  })
  return result
}

function saveCache() {
  if (isDirty) {
    logger.debug('Saving cache on disk')
    writeCacheFile(homeTxSendersCacheFile, cachedHomeTxSenders)
    writeCacheFile(homeIsContractCacheFile, cachedHomeIsContract)
    writeCacheFile(foreignIsContractCacheFile, cachedForeignIsContract)
  }
}

module.exports = {
  getHomeTxSender,
  getForeignTxSender,
  isHomeContract,
  isForeignContract,
  getPastEvents,
  saveCache
}
