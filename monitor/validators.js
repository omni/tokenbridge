require('dotenv').config()
const Web3Utils = require('web3').utils
const fetch = require('node-fetch')
const logger = require('./logger')('validators')
const { getBridgeABIs, BRIDGE_VALIDATORS_ABI, gasPriceFromSupplier } = require('../commons')
const { web3Home, web3Foreign, getHomeBlockNumber, getForeignBlockNumber } = require('./utils/web3')
const { getValidatorList } = require('./utils/getValidatorsList')

const {
  COMMON_HOME_BRIDGE_ADDRESS,
  COMMON_FOREIGN_BRIDGE_ADDRESS,
  COMMON_HOME_GAS_PRICE_SUPPLIER_URL,
  COMMON_HOME_GAS_PRICE_SPEED_TYPE,
  COMMON_HOME_GAS_PRICE_FALLBACK,
  COMMON_HOME_GAS_PRICE_FACTOR,
  COMMON_FOREIGN_GAS_PRICE_SUPPLIER_URL,
  COMMON_FOREIGN_GAS_PRICE_SPEED_TYPE,
  COMMON_FOREIGN_GAS_PRICE_FALLBACK,
  COMMON_FOREIGN_GAS_PRICE_FACTOR
} = process.env
const MONITOR_VALIDATOR_HOME_TX_LIMIT = Number(process.env.MONITOR_VALIDATOR_HOME_TX_LIMIT) || 0
const MONITOR_VALIDATOR_FOREIGN_TX_LIMIT = Number(process.env.MONITOR_VALIDATOR_FOREIGN_TX_LIMIT) || 0

const homeGasPriceSupplierOpts = {
  speedType: COMMON_HOME_GAS_PRICE_SPEED_TYPE,
  factor: COMMON_HOME_GAS_PRICE_FACTOR,
  logger
}

const foreignGasPriceSupplierOpts = {
  speedType: COMMON_FOREIGN_GAS_PRICE_SPEED_TYPE,
  factor: COMMON_FOREIGN_GAS_PRICE_FACTOR,
  logger
}

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

async function main(bridgeMode) {
  const { HOME_ABI, FOREIGN_ABI } = getBridgeABIs(bridgeMode)
  const homeBridge = new web3Home.eth.Contract(HOME_ABI, COMMON_HOME_BRIDGE_ADDRESS)
  const foreignBridge = new web3Foreign.eth.Contract(FOREIGN_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
  const homeValidatorsAddress = await homeBridge.methods.validatorContract().call()
  const homeBridgeValidators = new web3Home.eth.Contract(BRIDGE_VALIDATORS_ABI, homeValidatorsAddress)

  logger.debug('getting last block numbers')
  const homeBlockNumber = await getHomeBlockNumber()
  const foreignBlockNumber = await getForeignBlockNumber()
  const homeConfirmations = await homeBridge.methods.requiredBlockConfirmations().call()
  const foreignConfirmations = await foreignBridge.methods.requiredBlockConfirmations().call()
  const homeDelayedBlockNumber = homeBlockNumber - homeConfirmations
  const foreignDelayedBlockNumber = foreignBlockNumber - foreignConfirmations

  logger.debug('calling foreignBridge.methods.validatorContract().call()')
  const foreignValidatorsAddress = await foreignBridge.methods.validatorContract().call()
  const foreignBridgeValidators = new web3Foreign.eth.Contract(BRIDGE_VALIDATORS_ABI, foreignValidatorsAddress)

  logger.debug('calling foreignBridgeValidators getValidatorList()')
  const foreignValidators = (await getValidatorList(foreignValidatorsAddress, web3Foreign.eth, {
    toBlock: foreignBlockNumber,
    logger,
    chain: 'foreign',
    safeToBlock: foreignDelayedBlockNumber
  })).map(web3Foreign.utils.toChecksumAddress)

  logger.debug('calling homeBridgeValidators getValidatorList()')
  const homeValidators = (await getValidatorList(homeValidatorsAddress, web3Home.eth, {
    toBlock: homeBlockNumber,
    logger,
    chain: 'home',
    safeToBlock: homeDelayedBlockNumber
  })).map(web3Home.utils.toChecksumAddress)

  const foreignVBalances = {}
  const homeVBalances = {}

  let homeGasPrice
  let homeGasPriceGwei
  let homeTxCost

  if (MONITOR_VALIDATOR_HOME_TX_LIMIT) {
    logger.debug('calling home getGasPrices')
    homeGasPrice =
      (await gasPriceFromSupplier(() => fetch(COMMON_HOME_GAS_PRICE_SUPPLIER_URL), homeGasPriceSupplierOpts)) ||
      Web3Utils.toBN(COMMON_HOME_GAS_PRICE_FALLBACK)
    homeGasPriceGwei = Web3Utils.fromWei(homeGasPrice.toString(), 'gwei')
    homeTxCost = homeGasPrice.mul(Web3Utils.toBN(MONITOR_VALIDATOR_HOME_TX_LIMIT))
  }

  let foreignGasPrice
  let foreignGasPriceGwei
  let foreignTxCost

  if (MONITOR_VALIDATOR_FOREIGN_TX_LIMIT) {
    logger.debug('calling foreign getGasPrices')
    const fetchFn =
      COMMON_FOREIGN_GAS_PRICE_SUPPLIER_URL === 'gas-price-oracle'
        ? null
        : () => fetch(COMMON_FOREIGN_GAS_PRICE_SUPPLIER_URL)

    foreignGasPrice =
      (await gasPriceFromSupplier(fetchFn, foreignGasPriceSupplierOpts)) ||
      Web3Utils.toBN(COMMON_FOREIGN_GAS_PRICE_FALLBACK)
    foreignGasPriceGwei = Web3Utils.fromWei(foreignGasPrice.toString(), 'gwei')
    foreignTxCost = foreignGasPrice.mul(Web3Utils.toBN(MONITOR_VALIDATOR_FOREIGN_TX_LIMIT))
  }

  let validatorsMatch = true
  logger.debug('calling asyncForEach foreignValidators foreignVBalances')
  await asyncForEach(foreignValidators, async v => {
    const balance = await web3Foreign.eth.getBalance(v)
    if (MONITOR_VALIDATOR_FOREIGN_TX_LIMIT) {
      const leftTx = Web3Utils.toBN(balance)
        .div(foreignTxCost)
        .toString(10)
      foreignVBalances[v] = {
        balance: Web3Utils.fromWei(balance),
        leftTx: Number(leftTx),
        gasPrice: Number(foreignGasPriceGwei)
      }
    } else {
      foreignVBalances[v] = {
        balance: Web3Utils.fromWei(balance)
      }
    }

    if (!homeValidators.includes(v)) {
      validatorsMatch = false
      foreignVBalances[v].onlyOnForeign = true
    }
  })

  logger.debug('calling asyncForEach homeValidators homeVBalances')
  await asyncForEach(homeValidators, async v => {
    const balance = await web3Home.eth.getBalance(v)
    if (MONITOR_VALIDATOR_HOME_TX_LIMIT) {
      const leftTx = Web3Utils.toBN(balance)
        .div(homeTxCost)
        .toString(10)
      homeVBalances[v] = {
        balance: Web3Utils.fromWei(balance),
        leftTx: Number(leftTx),
        gasPrice: Number(homeGasPriceGwei)
      }
    } else {
      homeVBalances[v] = {
        balance: Web3Utils.fromWei(balance)
      }
    }

    if (!foreignValidators.includes(v)) {
      validatorsMatch = false
      homeVBalances[v].onlyOnHome = true
    }
  })

  logger.debug('calling homeBridgeValidators.methods.requiredSignatures().call()')
  const reqSigHome = await homeBridgeValidators.methods.requiredSignatures().call()
  logger.debug('calling foreignBridgeValidators.methods.requiredSignatures().call()')
  const reqSigForeign = await foreignBridgeValidators.methods.requiredSignatures().call()
  logger.debug('Done')
  return {
    home: {
      validators: {
        ...homeVBalances
      },
      requiredSignatures: Number(reqSigHome)
    },
    foreign: {
      validators: {
        ...foreignVBalances
      },
      requiredSignatures: Number(reqSigForeign)
    },
    requiredSignaturesMatch: reqSigHome === reqSigForeign,
    validatorsMatch,
    lastChecked: Math.floor(Date.now() / 1000)
  }
}

module.exports = main
