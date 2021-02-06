const { readFile } = require('./utils/file')

const {
  MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST,
  MONITOR_HOME_TO_FOREIGN_BLOCK_LIST,
  MONITOR_HOME_VALIDATORS_BALANCE_ENABLE,
  MONITOR_FOREIGN_VALIDATORS_BALANCE_ENABLE
} = process.env

const homeConf = {
  type: 'home',
  validatorsBalanceEnable: MONITOR_HOME_VALIDATORS_BALANCE_ENABLE
}
const foreignConf = {
  type: 'foreign',
  validatorsBalanceEnable: MONITOR_FOREIGN_VALIDATORS_BALANCE_ENABLE
}

const bridgeTypes = [homeConf, foreignConf]

function hasError(obj) {
  return 'error' in obj
}

function getPrometheusMetrics(bridgeName) {
  const metrics = {}

  // Balance metrics
  const balancesFile = readFile(`./responses/${bridgeName}/getBalances.json`)

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
  const validatorsFile = readFile(`./responses/${bridgeName}/validators.json`)

  if (!hasError(validatorsFile)) {
    for (const bridge of bridgeTypes) {
      const allValidators = validatorsFile[bridge.type].validators
      const validatorAddressesWithBalanceCheck =
        typeof bridge.validatorsBalanceEnable === 'string'
          ? bridge.validatorsBalanceEnable.split(' ')
          : Object.keys(allValidators)

      validatorAddressesWithBalanceCheck.forEach(addr => {
        metrics[`validators_balances_${bridge.type}_${addr}`] = allValidators[addr].balance
      })
    }
  }

  // Alert metrics
  const alertsFile = readFile(`./responses/${bridgeName}/alerts.json`)

  if (!hasError(alertsFile)) {
    for (const bridge of bridgeTypes) {
      const targetFunc = bridge.type === homeConf.type ? 'executeAffirmations' : 'executeSignatures'
      Object.entries(alertsFile[targetFunc].misbehavior).forEach(([period, val]) => {
        metrics[`misbehavior_${bridge.type}_${period}`] = val
      })
    }
  }

  // Pack metrcis into a plain text
  return Object.entries(metrics).reduceRight(
    // Prometheus supports `Nan` and possibly signed `Infinity`
    // in case cast to `Number` fails
    (acc, [key, val]) => `${key} ${val ? Number(val) : 0}\n${acc}`,
    ''
  )
}

module.exports = { getPrometheusMetrics }
