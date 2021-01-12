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
  COMMON_FOREIGN_GAS_PRICE_FACTOR,
  MONITOR_FOREIGN_VALIDATORS_BALANCE_ENABLE,
  MONITOR_HOME_VALIDATORS_BALANCE_ENABLE
} = process.env
const MONITOR_VALIDATOR_HOME_TX_LIMIT = Number(process.env.MONITOR_VALIDATOR_HOME_TX_LIMIT) || 0
const MONITOR_VALIDATOR_FOREIGN_TX_LIMIT = Number(process.env.MONITOR_VALIDATOR_FOREIGN_TX_LIMIT) || 0
const MONITOR_TX_NUMBER_THRESHOLD = Number(process.env.MONITOR_TX_NUMBER_THRESHOLD) || 100

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
  const foreignValidatorsWithBalanceCheck =
    typeof MONITOR_FOREIGN_VALIDATORS_BALANCE_ENABLE === 'string'
      ? MONITOR_FOREIGN_VALIDATORS_BALANCE_ENABLE.split(' ')
      : foreignValidators
  logger.debug('getting foreignValidators balances')
  await Promise.all(
    foreignValidators.map(async v => {
      foreignVBalances[v] = {}
      if (foreignValidatorsWithBalanceCheck.includes(v)) {
        const balance = await web3Foreign.eth.getBalance(v)
        foreignVBalances[v].balance = Web3Utils.fromWei(balance)
        if (MONITOR_VALIDATOR_FOREIGN_TX_LIMIT) {
          foreignVBalances[v].leftTx = Number(
            Web3Utils.toBN(balance)
              .div(foreignTxCost)
              .toString(10)
          )
          foreignVBalances[v].gasPrice = parseFloat(foreignGasPriceGwei)
        }
      }

      if (!homeValidators.includes(v)) {
        validatorsMatch = false
        foreignVBalances[v].onlyOnForeign = true
      }
    })
  )

  const homeValidatorsWithBalanceCheck =
    typeof MONITOR_HOME_VALIDATORS_BALANCE_ENABLE === 'string'
      ? MONITOR_HOME_VALIDATORS_BALANCE_ENABLE.split(' ')
      : homeValidators
  logger.debug('calling homeValidators balances')
  await Promise.all(
    homeValidators.map(async v => {
      homeVBalances[v] = {}
      if (homeValidatorsWithBalanceCheck.includes(v)) {
        const balance = await web3Home.eth.getBalance(v)
        homeVBalances[v].balance = Web3Utils.fromWei(balance)
        if (MONITOR_VALIDATOR_HOME_TX_LIMIT) {
          homeVBalances[v].leftTx = Number(
            Web3Utils.toBN(balance)
              .div(homeTxCost)
              .toString(10)
          )
          homeVBalances[v].gasPrice = parseFloat(homeGasPriceGwei)
        }
      }

      if (!foreignValidators.includes(v)) {
        validatorsMatch = false
        homeVBalances[v].onlyOnHome = true
      }
    })
  )

  logger.debug('calling homeBridgeValidators.methods.requiredSignatures().call()')
  const reqSigHome = await homeBridgeValidators.methods.requiredSignatures().call()
  logger.debug('calling foreignBridgeValidators.methods.requiredSignatures().call()')
  const reqSigForeign = await foreignBridgeValidators.methods.requiredSignatures().call()
  logger.debug('Done')
  return {
    home: {
      validators: homeVBalances,
      requiredSignatures: Number(reqSigHome)
    },
    foreign: {
      validators: foreignVBalances,
      requiredSignatures: Number(reqSigForeign)
    },
    requiredSignaturesMatch: reqSigHome === reqSigForeign,
    validatorsMatch,
    lastChecked: Math.floor(Date.now() / 1000),
    homeOk: Object.values(homeVBalances)
      .filter(vb => typeof vb.leftTx === 'number')
      .every(vb => vb.leftTx >= MONITOR_TX_NUMBER_THRESHOLD),
    foreignOk: Object.values(foreignVBalances)
      .filter(vb => typeof vb.leftTx === 'number')
      .every(vb => vb.leftTx >= MONITOR_TX_NUMBER_THRESHOLD)
  }
}

module.exports = main
