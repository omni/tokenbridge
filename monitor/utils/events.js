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
  TOKENS_SWAPPED_EVENT_ABI
} = require('../../commons')
const { normalizeEventInformation } = require('./message')

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
  let normalizeEvent = normalizeEventInformation
  if (bridgeMode !== BRIDGE_MODES.ARBITRARY_MESSAGE) {
    const erc20MethodName = bridgeMode === BRIDGE_MODES.NATIVE_TO_ERC || v1Bridge ? 'erc677token' : 'erc20token'
    const erc20Address = await foreignBridge.methods[erc20MethodName]().call()
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

    const foreignBridgeSwapped = new web3Foreign.eth.Contract([TOKENS_SWAPPED_EVENT_ABI], COMMON_FOREIGN_BRIDGE_ADDRESS)
    const tokensSwappedEvents = (await getPastEvents(foreignBridgeSwapped, {
      event: 'TokensSwapped',
      fromBlock: MONITOR_FOREIGN_START_BLOCK,
      toBlock: foreignBlockNumber
    })).map(normalizeEvent)

    // Get transfer events for each previous erc20
    await Promise.all(
      tokensSwappedEvents.map(async swap => {
        const previousERC20 = new web3Foreign.eth.Contract(ERC20_ABI, swap.recipient)

        const previousTransferEvents = (await getPastEvents(previousERC20, {
          event: 'Transfer',
          fromBlock: MONITOR_FOREIGN_START_BLOCK,
          toBlock: foreignBlockNumber,
          options: {
            filter: { to: COMMON_FOREIGN_BRIDGE_ADDRESS }
          }
        })).map(normalizeEvent)
        transferEvents = [...previousTransferEvents, ...transferEvents]
      })
    )

    // Get transfer events that didn't have a UserRequestForAffirmation event in the same transaction
    let directTransfers = transferEvents.filter(
      e => foreignToHomeRequests.findIndex(t => t.referenceTx === e.referenceTx) === -1
    )

    // filter transfer that is part of a token swap
    directTransfers = directTransfers.filter(
      e => tokensSwappedEvents.findIndex(t => t.referenceTx === e.referenceTx) === -1
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
