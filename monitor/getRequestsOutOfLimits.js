require('dotenv').config()
const BN = require('bignumber.js')
const { fromWei } = require('web3').utils
const logger = require('./logger')('getRequestsOutOfLimits')
const { BRIDGE_MODES, getBridgeABIs } = require('../commons')
const { web3Home, web3Foreign } = require('./utils/web3')

const { COMMON_HOME_BRIDGE_ADDRESS, COMMON_FOREIGN_BRIDGE_ADDRESS } = process.env

function outOfRemainingQuota(remainingLimit) {
  let limit = remainingLimit
  return event => {
    if (limit.lt(event.value)) {
      return true
    }
    limit = limit.minus(event.value)
    return false
  }
}

async function checkOutOfLimitsStats(contract, requests) {
  logger.debug('calling contract.getCurrentDay()')
  const day = await contract.methods.getCurrentDay().call()
  logger.debug('calling contract.executionDailyLimit()')
  const executionDailyLimit = new BN(await contract.methods.executionDailyLimit().call())
  logger.debug('calling contract.executionMaxPerTx()')
  const executionMaxPerTx = new BN(await contract.methods.executionMaxPerTx().call())
  logger.debug('calling contract.totalExecutedPerDay()')
  const executedPerDay = new BN(await contract.methods.totalExecutedPerDay(day).call())

  const remainingExecutionDailyLimit = executionDailyLimit.minus(executedPerDay)

  // value > executionMaxPerTx
  const requestsAboveMaxPerTx = requests.filter(event => executionMaxPerTx.lt(event.value))

  // value <= executionMaxPerTx && remainingExecutionDailyLimit < value
  const requestsAboveDailyLimit = requests
    .filter(event => executionMaxPerTx.gte(event.value))
    .filter(outOfRemainingQuota(remainingExecutionDailyLimit))

  return {
    aboveExecutionMaxPerTx: requestsAboveMaxPerTx.length,
    aboveExecutionDailyLimit: requestsAboveDailyLimit.length,
    aboveExecutionDailyLimitAmount: fromWei(BN.sum(0, ...requestsAboveDailyLimit.map(e => e.value)).toFixed()),
    remainingExecutionDailyLimit: fromWei(remainingExecutionDailyLimit.toFixed())
  }
}

async function main(bridgeMode, unprocessedRequests) {
  const { homeRequests, foreignRequests } = unprocessedRequests

  const { HOME_ABI, FOREIGN_ABI } = getBridgeABIs(bridgeMode)
  const foreignBridge = new web3Foreign.eth.Contract(FOREIGN_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
  const homeBridge = new web3Home.eth.Contract(HOME_ABI, COMMON_HOME_BRIDGE_ADDRESS)

  // replace the required methods by their legacy versions
  if (bridgeMode === BRIDGE_MODES.NATIVE_TO_ERC_V1) {
    homeBridge.methods.executionDailyLimit = homeBridge.methods.foreignDailyLimit
    homeBridge.methods.executionMaxPerTx = homeBridge.methods.foreignMaxPerTx
    foreignBridge.methods.executionDailyLimit = foreignBridge.methods.homeDailyLimit
    foreignBridge.methods.executionMaxPerTx = foreignBridge.methods.homeMaxPerTx
  }

  return {
    home: await checkOutOfLimitsStats(homeBridge, foreignRequests),
    foreign: await checkOutOfLimitsStats(foreignBridge, homeRequests)
  }
}

module.exports = main
