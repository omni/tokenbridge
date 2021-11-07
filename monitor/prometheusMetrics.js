require('dotenv').config()
const logger = require('./logger')('metrics')
const { readFile } = require('./utils/file')

const {
  MONITOR_HOME_START_BLOCK,
  MONITOR_FOREIGN_START_BLOCK,
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

// Try to collect all metrics from JSON responses and then
// discard all unsuccessfully retrieved ones
async function getPrometheusMetrics(bridgeName) {
  const responsePath = jsonName => `./responses/${bridgeName}/${jsonName}.json`

  const metrics = {}

  // Balance metrics
  const balancesFile = readFile(responsePath('getBalances'))

  if (!hasError(balancesFile)) {
    const { home, foreign, ...commonBalances } = balancesFile

    const balanceMetrics = {
      // ERC_TO_NATIVE mode
      balances_home_value: home.totalSupply,
      balances_home_txs_deposit: home.deposits,
      balances_home_txs_withdrawal: home.withdrawals,
      balances_foreign_value: foreign.erc20Balance,
      balances_foreign_txs_deposit: foreign.deposits,
      balances_foreign_txs_withdrawal: foreign.withdrawals,

      // Not ARBITRARY_MESSAGE mode
      balances_diff_value: commonBalances.balanceDiff,
      balances_diff_deposit: commonBalances.depositsDiff,
      balances_diff_withdrawal: commonBalances.withdrawalDiff,

      // MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST or MONITOR_HOME_TO_FOREIGN_BLOCK_LIST is set
      balances_unclaimed_txs: commonBalances.unclaimedDiff,
      balances_unclaimed_value: commonBalances.unclaimedBalance,

      // ARBITRARY_MESSAGE mode
      txs_home_out: home.toForeign,
      txs_home_in: home.fromForeign,
      txs_foreign_out: foreign.toHome,
      txs_foreign_in: foreign.fromHome,
      txs_diff_home_out_oracles: commonBalances.fromHomeToForeignDiff,
      txs_diff_home_out_users: commonBalances.fromHomeToForeignPBUDiff,
      txs_diff_foreign_out: commonBalances.fromForeignToHomeDiff
    }

    const blockRanges = {
      state_startblock_home: commonBalances.startBlockHome || MONITOR_HOME_START_BLOCK,
      state_startblock_foreign: commonBalances.startBlockForeign || MONITOR_FOREIGN_START_BLOCK,
      state_endblock_home: commonBalances.endBlockHome,
      state_endblock_foreign: commonBalances.endBlockForeign
    }

    Object.assign(metrics, blockRanges, balanceMetrics)
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
