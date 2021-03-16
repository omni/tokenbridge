require('dotenv').config()
const logger = require('./logger')('getBalances')
const { readFile } = require('./utils/file')

const {
  MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST,
  MONITOR_HOME_TO_FOREIGN_BLOCK_LIST,
  MONITOR_HOME_VALIDATORS_BALANCE_ENABLE,
  MONITOR_FOREIGN_VALIDATORS_BALANCE_ENABLE
} = process.env

function BridgeConf(type, validatorsBalanceEnable, alertTargetFunc, failureDirection) {
  this.type = type
  this.validatorsBalanceEnable = validatorsBalanceEnable
  this.alertTargetFunc = alertTargetFunc
  this.failureDirection = failureDirection
}

const BRIDGE_CONFS = [
  new BridgeConf('home', MONITOR_HOME_VALIDATORS_BALANCE_ENABLE, 'executeAffirmations', 'homeToForeign'),
  new BridgeConf('foreign', MONITOR_FOREIGN_VALIDATORS_BALANCE_ENABLE, 'executeSignatures', 'foreignToHome')
]

function hasError(obj) {
  return 'error' in obj
}

function getPrometheusMetrics(bridgeName) {
  const responsePath = jsonName => `./responses/${bridgeName}/${jsonName}.json`

  const metrics = {}

  // Balance metrics
  const balancesFile = readFile(responsePath('getBalances'))

  if (!hasError(balancesFile)) {
    const { home: homeBalances, foreign: foreignBalances, ...commonBalances } = balancesFile
    metrics.balances_home_value = homeBalances.totalSupply
    metrics.balances_home_txs_deposit = homeBalances.deposits
    metrics.balances_home_txs_withdrawal = homeBalances.withdrawals

    metrics.balances_foreign_value = foreignBalances.erc20Balance
    metrics.balances_foreign_txs_deposit = foreignBalances.deposits
    metrics.balances_foreign_txs_withdrawal = foreignBalances.withdrawals

    metrics.balances_diff_value = commonBalances.balanceDiff
    metrics.balances_diff_deposit = commonBalances.depositsDiff
    metrics.balances_diff_withdrawal = commonBalances.withdrawalDiff
    if (MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST || MONITOR_HOME_TO_FOREIGN_BLOCK_LIST) {
      metrics.balances_unclaimed_txs = commonBalances.unclaimedDiff
      metrics.balances_unclaimed_value = commonBalances.unclaimedBalance
    }
  }

  // Validator metrics
  const validatorsFile = readFile(responsePath('validators'))

  if (!hasError(validatorsFile)) {
    for (const bridge of BRIDGE_CONFS) {
      const allValidators = validatorsFile[bridge.type].validators
      const validatorAddressesWithBalanceCheck =
        typeof bridge.validatorsBalanceEnable === 'string'
          ? bridge.validatorsBalanceEnable.split(' ')
          : Object.keys(allValidators)

      validatorAddressesWithBalanceCheck.forEach((addr, ind) => {
        if (addr in allValidators) {
          metrics[`validators_balances_${bridge.type}${ind}{address="${addr}"}`] = allValidators[addr].balance
        } else {
          logger.debug(`Nonexistent validator address ${addr}`)
        }
      })
    }
  }

  // Alert metrics
  const alertsFile = readFile(responsePath('alerts'))

  if (!hasError(alertsFile)) {
    for (const bridge of BRIDGE_CONFS) {
      Object.entries(alertsFile[bridge.alertTargetFunc].misbehavior).forEach(([period, val]) => {
        metrics[`misbehavior_${bridge.type}_${period}`] = val
      })
    }
  }

  // Failure metrics
  const failureFile = readFile(responsePath('failures'))

  if (!hasError(failureFile)) {
    for (const bridge of BRIDGE_CONFS) {
      const dir = bridge.failureDirection
      const failures = failureFile[dir]
      metrics[`failures_${dir}_total`] = failures.total
      Object.entries(failures.stats).forEach(([period, count]) => {
        metrics[`failures_${dir}_${period}`] = count
      })
    }
  }

  // Pack metrcis into a plain text
  return Object.entries(metrics).reduceRight(
    // Prometheus supports `Nan` and possibly signed `Infinity`
    // in case cast to `Number` fails
    (acc, [key, val]) => {
      if (typeof val === 'undefined') return acc
      else return `${key} ${Number(val)}\n${acc}`
    },
    ''
  )
}

module.exports = getPrometheusMetrics
