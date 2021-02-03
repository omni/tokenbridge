const { readFile } = require('./utils/file')

const { MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST, MONITOR_HOME_TO_FOREIGN_BLOCK_LIST } = process.env

function hasError(obj) {
  return 'error' in obj
}

async function getPrometheusMetrics(bridgeName) {
  const metrics = {}

  // Balance metrics
  const balances = await readFile(`./responses/${bridgeName}/getBalances.json`)

  if (!hasError(balances)) {
    const { home: homeBalances, foreign: foreignBalances, ...commonBalances } = balances
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
  const validators = await readFile(`./responses/${bridgeName}/validators.json`)

  if (!hasError(validators)) {
    Object.entries(validators.home.validators).forEach(([, val], ind) => {
      metrics[`validators_balances_home_validator${ind}`] = val.balance
    })
    Object.entries(validators.foreign.validators).forEach(([, val], ind) => {
      metrics[`validators_balances_foreign_validator${ind}`] = val.balance
    })
  }

  // Alert metrics
  const alerts = await readFile(`./responses/${bridgeName}/alerts.json`)

  if (!hasError(alerts)) {
    Object.entries(alerts.executeSignatures.misbehavior).forEach(([period, val]) => {
      metrics[`misbehavior_foreign_${period}`] = val
    })
    Object.entries(alerts.executeAffirmations.misbehavior).forEach(([period, val]) => {
      metrics[`misbehavior_home_${period}`] = val
    })
  }

  // Pack metrcis into a plain text
  return Object.entries(metrics).reduceRight(
    // Prometheus supports `Nan` and possibly signed `Infinity`
    (acc, [key, val]) => `${key} ${val ? Number(val) : 0}\n${acc}`,
    ''
  )
}

module.exports = { getPrometheusMetrics }
