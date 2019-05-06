require('dotenv').config()
const fetch = require('node-fetch')
const Web3Utils = require('web3-utils')
const { web3Home, web3Foreign } = require('../services/web3')
const { bridgeConfig } = require('../../config/base.config')
const logger = require('../services/logger').child({
  module: 'gasPrice'
})
const { setIntervalAndRun } = require('../utils/utils')
const { DEFAULT_UPDATE_INTERVAL, GAS_PRICE_BOUNDARIES } = require('../utils/constants')

const HomeABI = bridgeConfig.homeBridgeAbi
const ForeignABI = bridgeConfig.foreignBridgeAbi

const {
  FOREIGN_BRIDGE_ADDRESS,
  FOREIGN_GAS_PRICE_FALLBACK,
  FOREIGN_GAS_PRICE_ORACLE_URL,
  FOREIGN_GAS_PRICE_SPEED_TYPE,
  FOREIGN_GAS_PRICE_UPDATE_INTERVAL,
  HOME_BRIDGE_ADDRESS,
  HOME_GAS_PRICE_FALLBACK,
  HOME_GAS_PRICE_ORACLE_URL,
  HOME_GAS_PRICE_SPEED_TYPE,
  HOME_GAS_PRICE_UPDATE_INTERVAL
} = process.env

const homeBridge = new web3Home.eth.Contract(HomeABI, HOME_BRIDGE_ADDRESS)

const foreignBridge = new web3Foreign.eth.Contract(ForeignABI, FOREIGN_BRIDGE_ADDRESS)

let cachedGasPrice = null

function gasPriceWithinLimits(gasPrice) {
  if (gasPrice < GAS_PRICE_BOUNDARIES.MIN) {
    return GAS_PRICE_BOUNDARIES.MIN
  } else if (gasPrice > GAS_PRICE_BOUNDARIES.MAX) {
    return GAS_PRICE_BOUNDARIES.MAX
  } else {
    return gasPrice
  }
}

async function fetchGasPriceFromOracle(oracleUrl, speedType) {
  const response = await fetch(oracleUrl)
  const json = await response.json()
  const oracleGasPrice = json[speedType]
  if (!oracleGasPrice) {
    throw new Error(`Response from Oracle didn't include gas price for ${speedType} type.`)
  }
  const gasPrice = gasPriceWithinLimits(oracleGasPrice)
  return Web3Utils.toWei(gasPrice.toString(), 'gwei')
}

async function fetchGasPrice({ bridgeContract, oracleFn }) {
  let gasPrice = null
  try {
    gasPrice = await oracleFn()
    logger.debug({ gasPrice }, 'Gas price updated using the oracle')
  } catch (e) {
    logger.error(`Gas Price API is not available. ${e.message}`)

    try {
      gasPrice = await bridgeContract.methods.gasPrice().call()
      logger.debug({ gasPrice }, 'Gas price updated using the contracts')
    } catch (e) {
      logger.error(`There was a problem getting the gas price from the contract. ${e.message}`)
    }
  }
  return gasPrice
}

let fetchGasPriceInterval = null

async function start(chainId) {
  clearInterval(fetchGasPriceInterval)

  let bridgeContract = null
  let oracleUrl = null
  let speedType = null
  let updateInterval = null
  if (chainId === 'home') {
    bridgeContract = homeBridge
    oracleUrl = HOME_GAS_PRICE_ORACLE_URL
    speedType = HOME_GAS_PRICE_SPEED_TYPE
    updateInterval = HOME_GAS_PRICE_UPDATE_INTERVAL || DEFAULT_UPDATE_INTERVAL

    cachedGasPrice = HOME_GAS_PRICE_FALLBACK
  } else if (chainId === 'foreign') {
    bridgeContract = foreignBridge
    oracleUrl = FOREIGN_GAS_PRICE_ORACLE_URL
    speedType = FOREIGN_GAS_PRICE_SPEED_TYPE
    updateInterval = FOREIGN_GAS_PRICE_UPDATE_INTERVAL || DEFAULT_UPDATE_INTERVAL

    cachedGasPrice = FOREIGN_GAS_PRICE_FALLBACK
  } else {
    throw new Error(`Unrecognized chainId '${chainId}'`)
  }

  fetchGasPriceInterval = setIntervalAndRun(async () => {
    const gasPrice = await fetchGasPrice({
      bridgeContract,
      oracleFn: () => fetchGasPriceFromOracle(oracleUrl, speedType)
    })
    cachedGasPrice = gasPrice || cachedGasPrice
  }, updateInterval)
}

function getPrice() {
  return cachedGasPrice
}

module.exports = {
  start,
  fetchGasPrice,
  getPrice,
  gasPriceWithinLimits
}
