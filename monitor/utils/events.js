require('dotenv').config()
const logger = require('../logger')('eventsUtils')
const {
  BRIDGE_MODES,
  getBridgeABIs,
  getBridgeMode,
  HOME_ERC_TO_NATIVE_ABI,
  ERC20_ABI,
  ZERO_ADDRESS,
  OLD_AMB_USER_REQUEST_FOR_SIGNATURE_ABI,
  OLD_AMB_USER_REQUEST_FOR_AFFIRMATION_ABI
} = require('../../commons')
const { normalizeEventInformation } = require('./message')
const { writeFile, readCacheFile } = require('./file')
const { web3Home, web3Foreign, getHomeBlockNumber, getForeignBlockNumber } = require('./web3')
const { getPastEvents } = require('./web3Cache')

const { COMMON_HOME_BRIDGE_ADDRESS, COMMON_FOREIGN_BRIDGE_ADDRESS, MONITOR_CACHE_EVENTS } = process.env
const MONITOR_HOME_START_BLOCK = Number(process.env.MONITOR_HOME_START_BLOCK) || 0
const MONITOR_FOREIGN_START_BLOCK = Number(process.env.MONITOR_FOREIGN_START_BLOCK) || 0

const cacheFilePath = '/tmp/cachedEvents.json'
async function main(mode) {
  if (MONITOR_CACHE_EVENTS === 'true') {
    logger.debug('checking existing events cache')
    const cachedEvents = readCacheFile(cacheFilePath)
    if (cachedEvents !== false) {
      logger.debug('returning events stored in cache')
      return cachedEvents
    }
  }

  const homeErcBridge = new web3Home.eth.Contract(HOME_ERC_TO_NATIVE_ABI, COMMON_HOME_BRIDGE_ADDRESS)
  const bridgeMode = mode || (await getBridgeMode(homeErcBridge))
  const { HOME_ABI, FOREIGN_ABI } = getBridgeABIs(bridgeMode)
  const homeBridge = new web3Home.eth.Contract(HOME_ABI, COMMON_HOME_BRIDGE_ADDRESS)
  const foreignBridge = new web3Foreign.eth.Contract(FOREIGN_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
  let isExternalErc20 = false
  let erc20Contract
  let erc20Address
  let normalizeEvent = normalizeEventInformation
  if (bridgeMode !== BRIDGE_MODES.ARBITRARY_MESSAGE) {
    erc20Address = await foreignBridge.methods.erc20token().call()
    isExternalErc20 = true
    erc20Contract = new web3Foreign.eth.Contract(ERC20_ABI, erc20Address)
  } else {
    normalizeEvent = e => e
  }

  logger.debug('getting last block numbers')
  const homeBlockNumber = await getHomeBlockNumber()
  const foreignBlockNumber = await getForeignBlockNumber()
  const homeConfirmations = await homeBridge.methods.requiredBlockConfirmations().call()
  const foreignConfirmations = await foreignBridge.methods.requiredBlockConfirmations().call()
  const homeDelayedBlockNumber = homeBlockNumber - homeConfirmations
  const foreignDelayedBlockNumber = foreignBlockNumber - foreignConfirmations

  let homeToForeignRequests = []
  let foreignToHomeRequests = []
  let homeMigrationBlock = MONITOR_HOME_START_BLOCK
  let foreignMigrationBlock = MONITOR_FOREIGN_START_BLOCK

  if (bridgeMode === BRIDGE_MODES.ARBITRARY_MESSAGE) {
    const oldHomeBridge = new web3Home.eth.Contract(OLD_AMB_USER_REQUEST_FOR_SIGNATURE_ABI, COMMON_HOME_BRIDGE_ADDRESS)
    const oldForeignBridge = new web3Foreign.eth.Contract(
      OLD_AMB_USER_REQUEST_FOR_AFFIRMATION_ABI,
      COMMON_FOREIGN_BRIDGE_ADDRESS
    )

    logger.debug("calling oldHomeBridge.getPastEvents('UserRequestForSignature(bytes)')")
    homeToForeignRequests = (await getPastEvents(oldHomeBridge, {
      event: 'UserRequestForSignature',
      fromBlock: MONITOR_HOME_START_BLOCK,
      toBlock: homeDelayedBlockNumber,
      chain: 'home'
    })).map(normalizeEvent)
    logger.debug(`found ${homeToForeignRequests.length} events`)
    if (homeToForeignRequests.length > 0) {
      homeMigrationBlock = Math.max(...homeToForeignRequests.map(x => x.blockNumber))
    }

    logger.debug("calling oldForeignBridge.getPastEvents('UserRequestForAffirmation(bytes)')")
    foreignToHomeRequests = (await getPastEvents(oldForeignBridge, {
      event: 'UserRequestForAffirmation',
      fromBlock: MONITOR_FOREIGN_START_BLOCK,
      toBlock: foreignDelayedBlockNumber,
      chain: 'foreign'
    })).map(normalizeEvent)
    logger.debug(`found ${foreignToHomeRequests.length} events`)
    if (foreignToHomeRequests.length > 0) {
      foreignMigrationBlock = Math.max(...foreignToHomeRequests.map(x => x.blockNumber))
    }
  }

  logger.debug("calling homeBridge.getPastEvents('UserRequestForSignature')")
  const homeToForeignRequestsNew = (await getPastEvents(homeBridge, {
    event: 'UserRequestForSignature',
    fromBlock: homeMigrationBlock,
    toBlock: homeDelayedBlockNumber,
    chain: 'home'
  })).map(normalizeEvent)
  homeToForeignRequests = [...homeToForeignRequests, ...homeToForeignRequestsNew]

  logger.debug("calling foreignBridge.getPastEvents('RelayedMessage')")
  const homeToForeignConfirmations = (await getPastEvents(foreignBridge, {
    event: 'RelayedMessage',
    fromBlock: MONITOR_FOREIGN_START_BLOCK,
    toBlock: foreignBlockNumber,
    chain: 'foreign',
    safeToBlock: foreignDelayedBlockNumber
  })).map(normalizeEvent)

  logger.debug("calling homeBridge.getPastEvents('AffirmationCompleted')")
  const foreignToHomeConfirmations = (await getPastEvents(homeBridge, {
    event: 'AffirmationCompleted',
    fromBlock: MONITOR_HOME_START_BLOCK,
    toBlock: homeBlockNumber,
    chain: 'home',
    safeToBlock: homeDelayedBlockNumber
  })).map(normalizeEvent)

  logger.debug("calling foreignBridge.getPastEvents('UserRequestForAffirmation')")
  const foreignToHomeRequestsNew = (await getPastEvents(foreignBridge, {
    event: 'UserRequestForAffirmation',
    fromBlock: foreignMigrationBlock,
    toBlock: foreignDelayedBlockNumber,
    chain: 'foreign'
  })).map(normalizeEvent)
  foreignToHomeRequests = [...foreignToHomeRequests, ...foreignToHomeRequestsNew]

  let informationRequests
  let informationResponses
  if (bridgeMode === BRIDGE_MODES.ARBITRARY_MESSAGE) {
    logger.debug("calling homeBridge.getPastEvents('UserRequestForInformation')")
    informationRequests = (await getPastEvents(homeBridge, {
      event: 'UserRequestForInformation',
      fromBlock: MONITOR_HOME_START_BLOCK,
      toBlock: homeDelayedBlockNumber,
      chain: 'home'
    })).map(normalizeEvent)

    logger.debug("calling foreignBridge.getPastEvents('InformationRetrieved')")
    informationResponses = (await getPastEvents(homeBridge, {
      event: 'InformationRetrieved',
      fromBlock: MONITOR_HOME_START_BLOCK,
      toBlock: homeBlockNumber,
      safeToBlock: homeDelayedBlockNumber,
      chain: 'home'
    })).map(normalizeEvent)
  }

  if (isExternalErc20) {
    logger.debug("calling erc20Contract.getPastEvents('Transfer')")
    let transferEvents = (await getPastEvents(erc20Contract, {
      event: 'Transfer',
      fromBlock: MONITOR_FOREIGN_START_BLOCK,
      toBlock: foreignDelayedBlockNumber,
      options: {
        filter: { to: COMMON_FOREIGN_BRIDGE_ADDRESS }
      },
      chain: 'foreign'
    }))
      .map(normalizeEvent)
      .filter(e => e.recipient !== ZERO_ADDRESS) // filter mint operation during SCD-to-MCD swaps
      .filter(e => e.recipient.toLowerCase() !== '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643') // filter cDai withdraws during compounding

    // Get transfer events for each previously used Sai token
    const saiTokenAddress = '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359'
    const halfDuplexTokenContract = new web3Foreign.eth.Contract(ERC20_ABI, saiTokenAddress)
    logger.debug('Half duplex token:', saiTokenAddress)
    logger.debug("calling halfDuplexTokenContract.getPastEvents('Transfer')")
    // https://etherscan.io/tx/0xd0c3c92c94e05bc71256055ce8c4c993e047f04e04f3283a04e4cb077b71f6c6
    const blockNumberHalfDuplexDisabled = 9884448
    const halfDuplexTransferEvents = (await getPastEvents(halfDuplexTokenContract, {
      event: 'Transfer',
      fromBlock: MONITOR_FOREIGN_START_BLOCK,
      toBlock: Math.min(blockNumberHalfDuplexDisabled, foreignDelayedBlockNumber),
      options: {
        filter: { to: COMMON_FOREIGN_BRIDGE_ADDRESS }
      },
      chain: 'foreign'
    })).map(normalizeEvent)

    transferEvents = [...halfDuplexTransferEvents, ...transferEvents]

    // Get transfer events that didn't have a UserRequestForAffirmation event in the same transaction
    const directTransfers = transferEvents.filter(
      e => foreignToHomeRequests.findIndex(t => t.referenceTx === e.referenceTx) === -1
    )

    foreignToHomeRequests = [...foreignToHomeRequests, ...directTransfers]
  }

  logger.debug('Done')
  const result = {
    homeToForeignRequests,
    homeToForeignConfirmations,
    foreignToHomeConfirmations,
    foreignToHomeRequests,
    informationRequests,
    informationResponses,
    isExternalErc20,
    bridgeMode,
    homeBlockNumber,
    foreignBlockNumber,
    homeDelayedBlockNumber,
    foreignDelayedBlockNumber
  }

  if (MONITOR_CACHE_EVENTS === 'true') {
    logger.debug('saving obtained events into cache file')
    writeFile(cacheFilePath, result, { useCwd: false })
  }
  return result
}

module.exports = main
