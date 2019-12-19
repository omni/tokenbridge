require('dotenv').config()
const Web3 = require('web3')
const { toBN } = require('web3').utils
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
  getPastEvents,
  ZERO_ADDRESS
} = require('../../commons')
const { normalizeEventInformation } = require('./message')
const { filterTransferBeforeES } = require('./tokenUtils')

const {
  COMMON_HOME_RPC_URL,
  COMMON_FOREIGN_RPC_URL,
  COMMON_HOME_BRIDGE_ADDRESS,
  COMMON_FOREIGN_BRIDGE_ADDRESS
} = process.env
const MONITOR_HOME_START_BLOCK = toBN(Number(process.env.MONITOR_HOME_START_BLOCK) || 0)
const MONITOR_FOREIGN_START_BLOCK = toBN(Number(process.env.MONITOR_FOREIGN_START_BLOCK) || 0)

const homeProvider = new Web3.providers.HttpProvider(COMMON_HOME_RPC_URL)
const web3Home = new Web3(homeProvider)

const foreignProvider = new Web3.providers.HttpProvider(COMMON_FOREIGN_RPC_URL)
const web3Foreign = new Web3(foreignProvider)

const { getBlockNumber } = require('./contract')

async function main(mode) {
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
  const [homeBlockNumber, foreignBlockNumber] = await getBlockNumber(web3Home, web3Foreign)

  logger.debug("calling homeBridge.getPastEvents('UserRequestForSignature')")
  const homeToForeignRequests = (await getPastEvents(homeBridge, {
    event: v1Bridge ? 'Deposit' : 'UserRequestForSignature',
    fromBlock: MONITOR_HOME_START_BLOCK,
    toBlock: homeBlockNumber
  })).map(normalizeEvent)

  logger.debug("calling foreignBridge.getPastEvents('RelayedMessage')")
  const homeToForeignConfirmations = (await getPastEvents(foreignBridge, {
    event: v1Bridge ? 'Deposit' : 'RelayedMessage',
    fromBlock: MONITOR_FOREIGN_START_BLOCK,
    toBlock: foreignBlockNumber
  })).map(normalizeEvent)

  logger.debug("calling homeBridge.getPastEvents('AffirmationCompleted')")
  const foreignToHomeConfirmations = (await getPastEvents(homeBridge, {
    event: v1Bridge ? 'Withdraw' : 'AffirmationCompleted',
    fromBlock: MONITOR_HOME_START_BLOCK,
    toBlock: homeBlockNumber
  })).map(normalizeEvent)

  logger.debug("calling foreignBridge.getPastEvents('UserRequestForAffirmation')")
  let foreignToHomeRequests = (await getPastEvents(foreignBridge, {
    event: v1Bridge ? 'Withdraw' : 'UserRequestForAffirmation',
    fromBlock: MONITOR_FOREIGN_START_BLOCK,
    toBlock: foreignBlockNumber
  })).map(normalizeEvent)
  if (isExternalErc20) {
    logger.debug("calling erc20Contract.getPastEvents('Transfer')")
    let transferEvents = (await getPastEvents(erc20Contract, {
      event: 'Transfer',
      fromBlock: MONITOR_FOREIGN_START_BLOCK,
      toBlock: foreignBlockNumber,
      options: {
        filter: { to: COMMON_FOREIGN_BRIDGE_ADDRESS }
      }
    })).map(normalizeEvent)

    let directTransfers = transferEvents
    const tokensSwappedAbiExists = FOREIGN_ABI.filter(e => e.type === 'event' && e.name === 'TokensSwapped')[0]
    if (tokensSwappedAbiExists) {
      const tokensSwappedEvents = await getPastEvents(foreignBridge, {
        event: 'TokensSwapped',
        fromBlock: MONITOR_FOREIGN_START_BLOCK,
        toBlock: foreignBlockNumber
      })

      // Get token swap events emitted by foreign bridge
      const bridgeTokensSwappedEvents = tokensSwappedEvents.filter(e => e.address === COMMON_FOREIGN_BRIDGE_ADDRESS)

      // Get transfer events for each previous erc20
      const uniqueTokenAddresses = [...new Set(bridgeTokensSwappedEvents.map(e => e.returnValues.from))]
      await Promise.all(
        uniqueTokenAddresses.map(async tokenAddress => {
          const halfDuplexTokenContract = new web3Foreign.eth.Contract(ERC20_ABI, tokenAddress)

          const halfDuplexTransferEvents = (await getPastEvents(halfDuplexTokenContract, {
            event: 'Transfer',
            fromBlock: MONITOR_FOREIGN_START_BLOCK,
            toBlock: foreignBlockNumber,
            options: {
              filter: { to: COMMON_FOREIGN_BRIDGE_ADDRESS }
            }
          })).map(normalizeEvent)

          // Remove events after the ES
          const validHalfDuplexTransfers = await filterTransferBeforeES(
            halfDuplexTransferEvents,
            web3Foreign,
            foreignBridge
          )

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
  return {
    homeToForeignRequests,
    homeToForeignConfirmations,
    foreignToHomeConfirmations,
    foreignToHomeRequests,
    isExternalErc20,
    bridgeMode
  }
}

module.exports = main
