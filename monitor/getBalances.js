require('dotenv').config()
const BN = require('bignumber.js')
const Web3Utils = require('web3').utils
const logger = require('./logger')('getBalances')
const { BRIDGE_MODES } = require('../commons')
const { web3Home, web3Foreign, getHomeBlockNumber } = require('./utils/web3')

const {
  MONITOR_HOME_START_BLOCK,
  MONITOR_FOREIGN_START_BLOCK,
  COMMON_HOME_BRIDGE_ADDRESS,
  COMMON_FOREIGN_BRIDGE_ADDRESS
} = process.env

const { ERC20_ABI, BLOCK_REWARD_ABI, HOME_ERC_TO_NATIVE_ABI, FOREIGN_ERC_TO_NATIVE_ABI } = require('../commons')

async function main(bridgeMode, eventsInfo) {
  const {
    homeBlockNumber,
    foreignBlockNumber,
    homeToForeignConfirmations,
    homeDelayedBlockNumber,
    foreignDelayedBlockNumber
  } = eventsInfo

  // Events in the ./utils/events.js are fetched for different block ranges,
  // In order to be consistent with the balance values, the following values might be needed

  // Foreign balance should represent all UserRequestForAffirmation events up to block `N - requiredBlockConfirmation()`
  // and all RelayedMessage events up to block `N`.
  // This constant tells the difference between bridge balance at block `N - requiredBlockConfirmation() + 1`
  // and the actual value monitor is interested in.
  const lateForeignConfirmationsTotalValue = BN.sum(
    0,
    ...homeToForeignConfirmations.filter(e => e.blockNumber > foreignDelayedBlockNumber).map(e => e.value)
  )

  const blockRanges = {
    startBlockHome: MONITOR_HOME_START_BLOCK,
    endBlockHome: homeBlockNumber,
    startBlockForeign: MONITOR_FOREIGN_START_BLOCK,
    endBlockForeign: foreignBlockNumber
  }

  if (bridgeMode === BRIDGE_MODES.ERC_TO_NATIVE) {
    const foreignBridge = new web3Foreign.eth.Contract(FOREIGN_ERC_TO_NATIVE_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
    const erc20Address = await foreignBridge.methods.erc20token().call()
    const erc20Contract = new web3Foreign.eth.Contract(ERC20_ABI, erc20Address)
    let investedAmountInDai = 0
    let bridgeDsrBalance = 0
    let displayChaiToken = false

    try {
      logger.debug('calling foreignBridge.methods.isChaiTokenEnabled')
      if (await foreignBridge.methods.isChaiTokenEnabled().call()) {
        displayChaiToken = true
        logger.debug('calling foreignBridge.methods.investedAmountInDai')
        investedAmountInDai = await foreignBridge.methods.investedAmountInDai().call()
        logger.debug('calling foreignBridge.methods.dsrBalance')
        bridgeDsrBalance = await foreignBridge.methods.dsrBalance().call()
      } else {
        logger.debug('Chai token is currently disabled')
      }
    } catch (e) {
      logger.debug('Methods for chai token are not present')
    }

    logger.debug('calling erc20Contract.methods.balanceOf')
    const foreignErc20Balance = await erc20Contract.methods
      .balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS)
      .call({}, foreignDelayedBlockNumber)

    const homeBridge = new web3Home.eth.Contract(HOME_ERC_TO_NATIVE_ABI, COMMON_HOME_BRIDGE_ADDRESS)
    logger.debug('calling homeBridge.methods.blockRewardContract')
    const blockRewardAddress = await homeBridge.methods.blockRewardContract().call()
    const blockRewardContract = new web3Home.eth.Contract(BLOCK_REWARD_ABI, blockRewardAddress)
    const homeBlockNumber = await getHomeBlockNumber()
    logger.debug('calling blockReward.methods.mintedTotally')
    const mintedCoins = await blockRewardContract.methods
      .mintedTotallyByBridge(COMMON_HOME_BRIDGE_ADDRESS)
      .call({}, homeBlockNumber)
    logger.debug('calling homeBridge.methods.totalBurntCoins')
    const burntCoins = await homeBridge.methods.totalBurntCoins().call({}, homeDelayedBlockNumber)
    const mintedCoinsBN = new BN(mintedCoins)
    const burntCoinsBN = new BN(burntCoins)
    const totalSupplyBN = mintedCoinsBN.minus(burntCoinsBN)
    const foreignErc20BalanceBN = new BN(foreignErc20Balance).plus(lateForeignConfirmationsTotalValue)
    const investedAmountInDaiBN = new BN(investedAmountInDai)
    const bridgeDsrBalanceBN = new BN(bridgeDsrBalance)

    const diff = foreignErc20BalanceBN
      .plus(investedAmountInDaiBN)
      .minus(totalSupplyBN)
      .toFixed()

    const foreign = {
      erc20Balance: Web3Utils.fromWei(foreignErc20Balance)
    }

    if (displayChaiToken) {
      foreign.investedErc20Balance = Web3Utils.fromWei(investedAmountInDai)
      foreign.accumulatedInterest = Web3Utils.fromWei(bridgeDsrBalanceBN.minus(investedAmountInDaiBN).toString(10))
    }

    logger.debug('Done')
    return {
      home: {
        totalSupply: Web3Utils.fromWei(totalSupplyBN.toFixed())
      },
      foreign,
      balanceDiff: Number(Web3Utils.fromWei(diff)),
      ...blockRanges,
      lastChecked: Math.floor(Date.now() / 1000)
    }
  } else if (bridgeMode === BRIDGE_MODES.ARBITRARY_MESSAGE) {
    return {
      home: {},
      foreign: {},
      ...blockRanges,
      lastChecked: Math.floor(Date.now() / 1000)
    }
  } else {
    throw new Error(`Unrecognized bridge mode: '${bridgeMode}'`)
  }
}

module.exports = main
