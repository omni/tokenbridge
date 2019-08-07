require('dotenv').config()
const Web3 = require('web3')
const fetch = require('node-fetch')
const logger = require('./logger')('validators')
const { getBridgeABIs, BRIDGE_VALIDATORS_ABI, getValidatorList, gasPriceFromOracle } = require('../commons')
const { getBlockNumber } = require('./utils/contract')

const {
  HOME_RPC_URL,
  FOREIGN_RPC_URL,
  HOME_BRIDGE_ADDRESS,
  FOREIGN_BRIDGE_ADDRESS,
  HOME_GAS_LIMIT,
  HOME_GAS_PRICE_ORACLE_URL,
  HOME_GAS_PRICE_SPEED_TYPE,
  HOME_GAS_PRICE_FALLBACK,
  HOME_GAS_PRICE_FACTOR,
  FOREIGN_GAS_LIMIT,
  FOREIGN_GAS_PRICE_ORACLE_URL,
  FOREIGN_GAS_PRICE_SPEED_TYPE,
  FOREIGN_GAS_PRICE_FALLBACK,
  FOREIGN_GAS_PRICE_FACTOR
} = process.env
const HOME_DEPLOYMENT_BLOCK = Number(process.env.HOME_DEPLOYMENT_BLOCK) || 0
const FOREIGN_DEPLOYMENT_BLOCK = Number(process.env.FOREIGN_DEPLOYMENT_BLOCK) || 0

const Web3Utils = Web3.utils

const homeProvider = new Web3.providers.HttpProvider(HOME_RPC_URL)
const web3Home = new Web3(homeProvider)

const foreignProvider = new Web3.providers.HttpProvider(FOREIGN_RPC_URL)
const web3Foreign = new Web3(foreignProvider)

const homeGasOracleOpts = {
  speedType: HOME_GAS_PRICE_SPEED_TYPE,
  factor: HOME_GAS_PRICE_FACTOR,
  logger
}

const foreignGasOracleOpts = {
  speedType: FOREIGN_GAS_PRICE_SPEED_TYPE,
  factor: FOREIGN_GAS_PRICE_FACTOR,
  logger
}

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

async function main(bridgeMode) {
  const { HOME_ABI, FOREIGN_ABI } = getBridgeABIs(bridgeMode)
  const homeBridge = new web3Home.eth.Contract(HOME_ABI, HOME_BRIDGE_ADDRESS)
  const foreignBridge = new web3Foreign.eth.Contract(FOREIGN_ABI, FOREIGN_BRIDGE_ADDRESS)
  const homeValidatorsAddress = await homeBridge.methods.validatorContract().call()
  const homeBridgeValidators = new web3Home.eth.Contract(BRIDGE_VALIDATORS_ABI, homeValidatorsAddress)

  logger.debug('getting last block numbers')
  const [homeBlockNumber, foreignBlockNumber] = await getBlockNumber(web3Home, web3Foreign)

  logger.debug('calling foreignBridge.methods.validatorContract().call()')
  const foreignValidatorsAddress = await foreignBridge.methods.validatorContract().call()
  const foreignBridgeValidators = new web3Foreign.eth.Contract(BRIDGE_VALIDATORS_ABI, foreignValidatorsAddress)

  logger.debug('calling foreignBridgeValidators getValidatorList()')
  const foreignValidators = await getValidatorList(foreignValidatorsAddress, web3Foreign.eth, {
    from: FOREIGN_DEPLOYMENT_BLOCK,
    to: foreignBlockNumber,
    logger
  })

  logger.debug('calling homeBridgeValidators getValidatorList()')
  const homeValidators = await getValidatorList(homeValidatorsAddress, web3Home.eth, {
    from: HOME_DEPLOYMENT_BLOCK,
    to: homeBlockNumber,
    logger
  })

  const homeBalances = {}
  logger.debug('calling asyncForEach homeValidators homeBalances')
  await asyncForEach(homeValidators, async v => {
    homeBalances[v] = Web3Utils.fromWei(await web3Home.eth.getBalance(v))
  })
  const foreignVBalances = {}
  const homeVBalances = {}

  logger.debug('calling home getGasPrices')
  const homeGasPrice =
    (await gasPriceFromOracle(() => fetch(HOME_GAS_PRICE_ORACLE_URL), homeGasOracleOpts)) ||
    Web3Utils.toBN(HOME_GAS_PRICE_FALLBACK)
  const homeGasPriceGwei = Web3Utils.fromWei(homeGasPrice.toString(), 'gwei')
  const homeTxCost = homeGasPrice.mul(Web3Utils.toBN(HOME_GAS_LIMIT))

  logger.debug('calling foreign getGasPrices')
  const foreignGasPrice =
    (await gasPriceFromOracle(() => fetch(FOREIGN_GAS_PRICE_ORACLE_URL), foreignGasOracleOpts)) ||
    Web3Utils.toBN(FOREIGN_GAS_PRICE_FALLBACK)
  const foreignGasPriceGwei = Web3Utils.fromWei(foreignGasPrice.toString(), 'gwei')
  const foreignTxCost = foreignGasPrice.mul(Web3Utils.toBN(FOREIGN_GAS_LIMIT))

  let validatorsMatch = true
  logger.debug('calling asyncForEach foreignValidators foreignVBalances')
  await asyncForEach(foreignValidators, async v => {
    const balance = await web3Foreign.eth.getBalance(v)
    const leftTx = Web3Utils.toBN(balance)
      .div(foreignTxCost)
      .toString(10)
    foreignVBalances[v] = {
      balance: Web3Utils.fromWei(balance),
      leftTx: Number(leftTx),
      gasPrice: Number(foreignGasPriceGwei)
    }
    if (!homeValidators.includes(v)) {
      validatorsMatch = false
      foreignVBalances[v].onlyOnForeign = true
    }
  })
  logger.debug('calling asyncForEach homeValidators homeVBalances')
  await asyncForEach(homeValidators, async v => {
    const balance = await web3Home.eth.getBalance(v)
    const leftTx = homeTxCost.isZero()
      ? 999999
      : Web3Utils.toBN(balance)
          .div(homeTxCost)
          .toString(10)
    homeVBalances[v] = {
      balance: Web3Utils.fromWei(balance),
      leftTx: Number(leftTx),
      gasPrice: Number(homeGasPriceGwei)
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
