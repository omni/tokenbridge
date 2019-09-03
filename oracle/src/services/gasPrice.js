require('../../env')
const fetch = require('node-fetch')
const { web3Home, web3Foreign } = require('../services/web3')
const { bridgeConfig } = require('../../config/base.config')
const logger = require('../services/logger').child({
  module: 'gasPrice'
})
const { setIntervalAndRun } = require('../utils/utils')
const { DEFAULT_UPDATE_INTERVAL, GAS_PRICE_BOUNDARIES, DEFAULT_GAS_PRICE_FACTOR } = require('../utils/constants')
const { gasPriceFromOracle, gasPriceFromContract } = require('../../../commons')

const HomeABI = bridgeConfig.homeBridgeAbi
const ForeignABI = bridgeConfig.foreignBridgeAbi

const {
  COMMON_FOREIGN_BRIDGE_ADDRESS,
  FOREIGN_GAS_PRICE_FALLBACK,
  FOREIGN_GAS_PRICE_ORACLE_URL,
  FOREIGN_GAS_PRICE_SPEED_TYPE,
  FOREIGN_GAS_PRICE_UPDATE_INTERVAL,
  FOREIGN_GAS_PRICE_FACTOR,
  COMMON_HOME_BRIDGE_ADDRESS,
  HOME_GAS_PRICE_FALLBACK,
  HOME_GAS_PRICE_ORACLE_URL,
  HOME_GAS_PRICE_SPEED_TYPE,
  HOME_GAS_PRICE_UPDATE_INTERVAL,
  HOME_GAS_PRICE_FACTOR
} = process.env

const homeBridge = new web3Home.eth.Contract(HomeABI, COMMON_HOME_BRIDGE_ADDRESS)

const foreignBridge = new web3Foreign.eth.Contract(ForeignABI, COMMON_FOREIGN_BRIDGE_ADDRESS)

let cachedGasPrice = null

let fetchGasPriceInterval = null

const fetchGasPrice = async (speedType, factor, bridgeContract, oracleFetchFn) => {
  const contractOptions = { logger }
  const oracleOptions = { speedType, factor, limits: GAS_PRICE_BOUNDARIES, logger }
  cachedGasPrice =
    (await gasPriceFromOracle(oracleFetchFn, oracleOptions)) ||
    (await gasPriceFromContract(bridgeContract, contractOptions)) ||
    cachedGasPrice
  return cachedGasPrice
}

async function start(chainId) {
  clearInterval(fetchGasPriceInterval)

  let bridgeContract = null
  let oracleUrl = null
  let speedType = null
  let updateInterval = null
  let factor = null
  if (chainId === 'home') {
    bridgeContract = homeBridge
    oracleUrl = HOME_GAS_PRICE_ORACLE_URL
    speedType = HOME_GAS_PRICE_SPEED_TYPE
    updateInterval = HOME_GAS_PRICE_UPDATE_INTERVAL || DEFAULT_UPDATE_INTERVAL
    factor = Number(HOME_GAS_PRICE_FACTOR) || DEFAULT_GAS_PRICE_FACTOR

    cachedGasPrice = HOME_GAS_PRICE_FALLBACK
  } else if (chainId === 'foreign') {
    bridgeContract = foreignBridge
    oracleUrl = FOREIGN_GAS_PRICE_ORACLE_URL
    speedType = FOREIGN_GAS_PRICE_SPEED_TYPE
    updateInterval = FOREIGN_GAS_PRICE_UPDATE_INTERVAL || DEFAULT_UPDATE_INTERVAL
    factor = Number(FOREIGN_GAS_PRICE_FACTOR) || DEFAULT_GAS_PRICE_FACTOR

    cachedGasPrice = FOREIGN_GAS_PRICE_FALLBACK
  } else {
    throw new Error(`Unrecognized chainId '${chainId}'`)
  }

  fetchGasPriceInterval = setIntervalAndRun(
    () => fetchGasPrice(speedType, factor, bridgeContract, () => fetch(oracleUrl)),
    updateInterval
  )
}

function getPrice() {
  return cachedGasPrice
}

module.exports = {
  start,
  getPrice,
  fetchGasPrice
}
