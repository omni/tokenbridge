require('dotenv').config()
const logger = require('../logger')('eventsUtils')
const {
  BRIDGE_MODES,
  ERC_TYPES,
  getBridgeABIs,
  getBridgeMode,
  HOME_ERC_TO_ERC_ABI,
  ERC20_ABI,
  ERC677_BRIDGE_TOKEN_ABI,
  getTokenType,
  ZERO_ADDRESS,
  OLD_AMB_USER_REQUEST_FOR_SIGNATURE_ABI,
  OLD_AMB_USER_REQUEST_FOR_AFFIRMATION_ABI
} = require('../../commons')
const { normalizeEventInformation } = require('./message')
const { filterTransferBeforeES } = require('./tokenUtils')
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

  const homeErcBridge = new web3Home.eth.Contract(HOME_ERC_TO_ERC_ABI, COMMON_HOME_BRIDGE_ADDRESS)
  const bridgeMode = mode || (await getBridgeMode(homeErcBridge))
  const { HOME_ABI, FOREIGN_ABI } = getBridgeABIs(bridgeMode)
  const homeBridge = new web3Home.eth.Contract(HOME_ABI, COMMON_HOME_BRIDGE_ADDRESS)
  const foreignBridge = new web3Foreign.eth.Contract(FOREIGN_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
  const v1Bridge = bridgeMode === BRIDGE_MODES.NATIVE_TO_ERC_V1
  let isExternalErc20
  let erc20Contract
  let erc20Address
  let normalizeEvent = normalizeEventInformation
  if (bridgeMode !== BRIDGE_MODES.ARBITRARY_MESSAGE) {
    const erc20MethodName = bridgeMode === BRIDGE_MODES.NATIVE_TO_ERC || v1Bridge ? 'erc677token' : 'erc20token'
    erc20Address = await foreignBridge.methods[erc20MethodName]().call()
    const tokenType = await getTokenType(
      new web3Foreign.eth.Contract(ERC677_BRIDGE_TOKEN_ABI, erc20Address),
      COMMON_FOREIGN_BRIDGE_ADDRESS
    )
    isExternalErc20 = tokenType === ERC_TYPES.ERC20
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
    event: v1Bridge ? 'Deposit' : 'UserRequestForSignature',
    fromBlock: homeMigrationBlock,
    toBlock: homeDelayedBlockNumber,
    chain: 'home'
  })).map(normalizeEvent)
  homeToForeignRequests = [...homeToForeignRequests, ...homeToForeignRequestsNew]

  logger.debug("calling foreignBridge.getPastEvents('RelayedMessage')")
  const homeToForeignConfirmations = (await getPastEvents(foreignBridge, {
    event: v1Bridge ? 'Deposit' : 'RelayedMessage',
    fromBlock: MONITOR_FOREIGN_START_BLOCK,
    toBlock: foreignBlockNumber,
    chain: 'foreign',
    safeToBlock: foreignDelayedBlockNumber
  })).map(normalizeEvent)

  logger.debug("calling homeBridge.getPastEvents('AffirmationCompleted')")
  const foreignToHomeConfirmations = (await getPastEvents(homeBridge, {
    event: v1Bridge ? 'Withdraw' : 'AffirmationCompleted',
    fromBlock: MONITOR_HOME_START_BLOCK,
    toBlock: homeBlockNumber,
    chain: 'home',
    safeToBlock: homeDelayedBlockNumber
  })).map(normalizeEvent)

  logger.debug("calling foreignBridge.getPastEvents('UserRequestForAffirmation')")
  const foreignToHomeRequestsNew = (await getPastEvents(foreignBridge, {
    event: v1Bridge ? 'Withdraw' : 'UserRequestForAffirmation',
    fromBlock: foreignMigrationBlock,
    toBlock: foreignDelayedBlockNumber,
    chain: 'foreign'
  })).map(normalizeEvent)
  foreignToHomeRequests = [...foreignToHomeRequests, ...foreignToHomeRequestsNew]

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
    })).map(normalizeEvent)

    let directTransfers = transferEvents
    const tokensSwappedAbiExists = FOREIGN_ABI.filter(e => e.type === 'event' && e.name === 'TokensSwapped')[0]
    if (tokensSwappedAbiExists) {
      logger.debug('collecting half duplex tokens participated in the bridge balance')
      logger.debug("calling foreignBridge.getPastEvents('TokensSwapped')")
      const tokensSwappedEvents = await getPastEvents(foreignBridge, {
        event: 'TokensSwapped',
        fromBlock: MONITOR_FOREIGN_START_BLOCK,
        toBlock: foreignBlockNumber,
        chain: 'foreign',
        safeToBlock: foreignDelayedBlockNumber
      })

      // Get token swap events emitted by foreign bridge
      const bridgeTokensSwappedEvents = tokensSwappedEvents.filter(e => e.address === COMMON_FOREIGN_BRIDGE_ADDRESS)

      // Get transfer events for each previous erc20
      const uniqueTokenAddressesSet = new Set(bridgeTokensSwappedEvents.map(e => e.returnValues.from))

      // Exclude chai token from previous erc20
      try {
        logger.debug('calling foreignBridge.chaiToken() to remove it from half duplex tokens list')
        const chaiToken = await foreignBridge.methods.chaiToken().call()
        uniqueTokenAddressesSet.delete(chaiToken)
      } catch (e) {
        logger.debug('call to foreignBridge.chaiToken() failed')
      }
      // Exclude dai token from previous erc20
      try {
        logger.debug('calling foreignBridge.erc20token()  to remove it from half duplex tokens list')
        const daiToken = await foreignBridge.methods.erc20token().call()
        uniqueTokenAddressesSet.delete(daiToken)
      } catch (e) {
        logger.debug('call to foreignBridge.erc20token() failed')
      }

      const uniqueTokenAddresses = [...uniqueTokenAddressesSet]
      await Promise.all(
        uniqueTokenAddresses.map(async tokenAddress => {
          const halfDuplexTokenContract = new web3Foreign.eth.Contract(ERC20_ABI, tokenAddress)

          logger.debug('Half duplex token:', tokenAddress)
          logger.debug("calling halfDuplexTokenContract.getPastEvents('Transfer')")
          const halfDuplexTransferEvents = (await getPastEvents(halfDuplexTokenContract, {
            event: 'Transfer',
            fromBlock: MONITOR_FOREIGN_START_BLOCK,
            toBlock: foreignDelayedBlockNumber,
            options: {
              filter: { to: COMMON_FOREIGN_BRIDGE_ADDRESS }
            },
            chain: 'foreign'
          })).map(normalizeEvent)

          // Remove events after the ES
          logger.debug('filtering half duplex transfers happened before ES')
          const validHalfDuplexTransfers = await filterTransferBeforeES(halfDuplexTransferEvents)

          transferEvents = [...validHalfDuplexTransfers, ...transferEvents]
        })
      )

      // filter transfer that is part of a token swap
      directTransfers = transferEvents.filter(
        e =>
          bridgeTokensSwappedEvents.findIndex(
            t => t.transactionHash === e.referenceTx && e.recipient === ZERO_ADDRESS
          ) === -1
      )
    }

    // Get transfer events that didn't have a UserRequestForAffirmation event in the same transaction
    directTransfers = directTransfers.filter(
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
    isExternalErc20,
    bridgeMode,
    homeDelayedBlockNumber,
    foreignDelayedBlockNumber
  }

  if (MONITOR_CACHE_EVENTS === 'true') {
    logger.debug('saving obtained events into cache file')
    writeFile(cacheFilePath, result, false)
  }
  return result
}

module.exports = main
