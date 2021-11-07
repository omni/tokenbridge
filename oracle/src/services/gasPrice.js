require('../../env')
const { home, foreign } = require('../../config/base.config')
const logger = require('../services/logger').child({
  module: 'gasPrice'
})
const { setIntervalAndRun } = require('../utils/utils')
const { DEFAULT_UPDATE_INTERVAL, GAS_PRICE_BOUNDARIES, DEFAULT_GAS_PRICE_FACTOR } = require('../utils/constants')
const { gasPriceFromSupplier, gasPriceFromContract } = require('../../../commons')

const {
  COMMON_FOREIGN_GAS_PRICE_FALLBACK,
  COMMON_FOREIGN_GAS_PRICE_SUPPLIER_URL,
  COMMON_FOREIGN_GAS_PRICE_SPEED_TYPE,
  ORACLE_FOREIGN_GAS_PRICE_UPDATE_INTERVAL,
  COMMON_FOREIGN_GAS_PRICE_FACTOR,
  COMMON_HOME_GAS_PRICE_FALLBACK,
  COMMON_HOME_GAS_PRICE_SUPPLIER_URL,
  COMMON_HOME_GAS_PRICE_SPEED_TYPE,
  ORACLE_HOME_GAS_PRICE_UPDATE_INTERVAL,
  COMMON_HOME_GAS_PRICE_FACTOR
} = process.env

let cachedGasPrice = null

let fetchGasPriceInterval = null

const fetchGasPrice = async (speedType, factor, bridgeContract, gasPriceSupplierUrl) => {
  const contractOptions = { logger }
  const supplierOptions = { speedType, factor, limits: GAS_PRICE_BOUNDARIES, logger }
  cachedGasPrice =
    (await gasPriceFromSupplier(gasPriceSupplierUrl, supplierOptions)) ||
    (await gasPriceFromContract(bridgeContract, contractOptions)) ||
    cachedGasPrice
  return cachedGasPrice
}

async function start(chainId, fetchOnce) {
  clearInterval(fetchGasPriceInterval)

  let contract = null
  let gasPriceSupplierUrl = null
  let speedType = null
  let updateInterval = null
  let factor = null
  if (chainId === 'home') {
    contract = home.bridgeContract
    gasPriceSupplierUrl = COMMON_HOME_GAS_PRICE_SUPPLIER_URL
    speedType = COMMON_HOME_GAS_PRICE_SPEED_TYPE
    updateInterval = ORACLE_HOME_GAS_PRICE_UPDATE_INTERVAL || DEFAULT_UPDATE_INTERVAL
    factor = Number(COMMON_HOME_GAS_PRICE_FACTOR) || DEFAULT_GAS_PRICE_FACTOR

    cachedGasPrice = COMMON_HOME_GAS_PRICE_FALLBACK
  } else if (chainId === 'foreign') {
    contract = foreign.bridgeContract
    gasPriceSupplierUrl = COMMON_FOREIGN_GAS_PRICE_SUPPLIER_URL
    speedType = COMMON_FOREIGN_GAS_PRICE_SPEED_TYPE
    updateInterval = ORACLE_FOREIGN_GAS_PRICE_UPDATE_INTERVAL || DEFAULT_UPDATE_INTERVAL
    factor = Number(COMMON_FOREIGN_GAS_PRICE_FACTOR) || DEFAULT_GAS_PRICE_FACTOR

    cachedGasPrice = COMMON_FOREIGN_GAS_PRICE_FALLBACK
  } else {
    throw new Error(`Unrecognized chainId '${chainId}'`)
  }

  if (!gasPriceSupplierUrl) {
    logger.warn({ chainId }, 'Gas price API is not configured, will fallback to the contract-supplied gas price')
  }

  if (fetchOnce) {
    await fetchGasPrice(speedType, factor, contract, gasPriceSupplierUrl)
  } else {
    fetchGasPriceInterval = await setIntervalAndRun(
      () => fetchGasPrice(speedType, factor, contract, gasPriceSupplierUrl),
      updateInterval
    )
  }
}

function getPrice() {
  return cachedGasPrice
}

module.exports = {
  start,
  getPrice,
  fetchGasPrice
}
