require('dotenv').config()
const BN = require('bignumber.js')
const Web3 = require('web3')
const logger = require('./logger')('getBalances')
const { BRIDGE_MODES } = require('../commons')

const Web3Utils = Web3.utils

const {
  COMMON_HOME_RPC_URL,
  COMMON_FOREIGN_RPC_URL,
  COMMON_HOME_BRIDGE_ADDRESS,
  COMMON_FOREIGN_BRIDGE_ADDRESS
} = process.env

const homeProvider = new Web3.providers.HttpProvider(COMMON_HOME_RPC_URL)
const web3Home = new Web3(homeProvider)

const foreignProvider = new Web3.providers.HttpProvider(COMMON_FOREIGN_RPC_URL)
const web3Foreign = new Web3(foreignProvider)

const {
  ERC20_ABI,
  ERC677_ABI,
  BLOCK_REWARD_ABI,
  HOME_ERC_TO_ERC_ABI,
  HOME_ERC_TO_NATIVE_ABI,
  FOREIGN_ERC_TO_ERC_ABI,
  FOREIGN_ERC_TO_NATIVE_ABI,
  FOREIGN_NATIVE_TO_ERC_ABI
} = require('../commons')

async function main(bridgeMode) {
  if (bridgeMode === BRIDGE_MODES.ERC_TO_ERC) {
    const foreignBridge = new web3Foreign.eth.Contract(FOREIGN_ERC_TO_ERC_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
    const erc20Address = await foreignBridge.methods.erc20token().call()
    const erc20Contract = new web3Foreign.eth.Contract(ERC20_ABI, erc20Address)
    logger.debug('calling erc20Contract.methods.balanceOf')
    const foreignErc20Balance = await erc20Contract.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()
    const homeBridge = new web3Home.eth.Contract(HOME_ERC_TO_ERC_ABI, COMMON_HOME_BRIDGE_ADDRESS)
    logger.debug('calling homeBridge.methods.erc677token')
    const tokenAddress = await homeBridge.methods.erc677token().call()
    const tokenContract = new web3Home.eth.Contract(ERC677_ABI, tokenAddress)
    logger.debug('calling tokenContract.methods.totalSupply()')
    const totalSupply = await tokenContract.methods.totalSupply().call()
    const foreignBalanceBN = new BN(foreignErc20Balance)
    const foreignTotalSupplyBN = new BN(totalSupply)
    const diff = foreignBalanceBN.minus(foreignTotalSupplyBN).toString(10)
    logger.debug('Done')
    return {
      home: {
        totalSupply: Web3Utils.fromWei(totalSupply)
      },
      foreign: {
        erc20Balance: Web3Utils.fromWei(foreignErc20Balance)
      },
      balanceDiff: Number(Web3Utils.fromWei(diff)),
      lastChecked: Math.floor(Date.now() / 1000)
    }
  } else if (bridgeMode === BRIDGE_MODES.NATIVE_TO_ERC || bridgeMode === BRIDGE_MODES.NATIVE_TO_ERC_V1) {
    logger.debug('calling web3Home.eth.getBalance')
    const foreignBridge = new web3Foreign.eth.Contract(FOREIGN_NATIVE_TO_ERC_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
    const erc20Address = await foreignBridge.methods.erc677token().call()
    const homeBalance = await web3Home.eth.getBalance(COMMON_HOME_BRIDGE_ADDRESS)
    const tokenContract = new web3Foreign.eth.Contract(ERC20_ABI, erc20Address)
    logger.debug('calling tokenContract.methods.totalSupply()')
    const totalSupply = await tokenContract.methods.totalSupply().call()
    const homeBalanceBN = new BN(homeBalance)
    const foreignTotalSupplyBN = new BN(totalSupply)
    const diff = homeBalanceBN.minus(foreignTotalSupplyBN).toString(10)
    logger.debug('Done')
    return {
      home: {
        balance: Web3Utils.fromWei(homeBalance)
      },
      foreign: {
        totalSupply: Web3Utils.fromWei(totalSupply)
      },
      balanceDiff: Number(Web3Utils.fromWei(diff)),
      lastChecked: Math.floor(Date.now() / 1000)
    }
  } else if (bridgeMode === BRIDGE_MODES.ERC_TO_NATIVE) {
    const foreignBridge = new web3Foreign.eth.Contract(FOREIGN_ERC_TO_NATIVE_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
    const erc20Address = await foreignBridge.methods.erc20token().call()
    const erc20Contract = new web3Foreign.eth.Contract(ERC20_ABI, erc20Address)
    let foreignHalfDuplexErc20Balance = 0
    let displayHalfDuplexToken = false
    let tokenSwapAllowed = false
    try {
      const halfDuplexTokenAddress = await foreignBridge.methods.halfDuplexErc20token().call()
      if (halfDuplexTokenAddress !== erc20Address) {
        const halfDuplexToken = new web3Foreign.eth.Contract(ERC20_ABI, halfDuplexTokenAddress)
        logger.debug('calling halfDuplexToken.methods.balanceOf')
        foreignHalfDuplexErc20Balance = await halfDuplexToken.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()
        logger.debug('getting last block numbers')
        const block = await web3Foreign.eth.getBlock('latest')

        logger.debug(`Checking if SCD Emergency Shutdown has happened`)
        tokenSwapAllowed = await foreignBridge.methods.isTokenSwapAllowed(block.timestamp).call()
        displayHalfDuplexToken = true
      }
    } catch (e) {
      logger.debug('Methods for half duplex token are not present')
    }

    logger.debug('calling erc20Contract.methods.balanceOf')
    const foreignErc20Balance = await erc20Contract.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()

    const homeBridge = new web3Home.eth.Contract(HOME_ERC_TO_NATIVE_ABI, COMMON_HOME_BRIDGE_ADDRESS)
    logger.debug('calling homeBridge.methods.blockRewardContract')
    const blockRewardAddress = await homeBridge.methods.blockRewardContract().call()
    const blockRewardContract = new web3Home.eth.Contract(BLOCK_REWARD_ABI, blockRewardAddress)
    logger.debug('calling blockReward.methods.mintedTotally')
    const mintedCoins = await blockRewardContract.methods.mintedTotallyByBridge(COMMON_HOME_BRIDGE_ADDRESS).call()
    logger.debug('calling homeBridge.methods.totalBurntCoins')
    const burntCoins = await homeBridge.methods.totalBurntCoins().call()

    const mintedCoinsBN = new BN(mintedCoins)
    const burntCoinsBN = new BN(burntCoins)
    const totalSupplyBN = mintedCoinsBN.minus(burntCoinsBN)
    const foreignErc20BalanceBN = new BN(foreignErc20Balance)
    const halfDuplexErc20BalanceBN =
      displayHalfDuplexToken && tokenSwapAllowed ? new BN(foreignHalfDuplexErc20Balance) : new BN(0)

    const diff = foreignErc20BalanceBN
      .plus(halfDuplexErc20BalanceBN)
      .minus(totalSupplyBN)
      .toFixed()

    let foreign = {
      erc20Balance: Web3Utils.fromWei(foreignErc20Balance)
    }

    if (displayHalfDuplexToken && tokenSwapAllowed) {
      foreign = {
        ...foreign,
        halfDuplexErc20Balance: Web3Utils.fromWei(foreignHalfDuplexErc20Balance)
      }
    } else if (displayHalfDuplexToken && !tokenSwapAllowed) {
      foreign = {
        ...foreign,
        halfDuplexErc20BalanceAfterES: Web3Utils.fromWei(foreignHalfDuplexErc20Balance)
      }
    }

    logger.debug('Done')
    return {
      home: {
        totalSupply: Web3Utils.fromWei(totalSupplyBN.toFixed())
      },
      foreign,
      balanceDiff: Number(Web3Utils.fromWei(diff)),
      lastChecked: Math.floor(Date.now() / 1000)
    }
  } else if (bridgeMode === BRIDGE_MODES.ARBITRARY_MESSAGE) {
    return {
      home: {},
      foreign: {},
      lastChecked: Math.floor(Date.now() / 1000)
    }
  } else {
    throw new Error(`Unrecognized bridge mode: '${bridgeMode}'`)
  }
}

module.exports = main
