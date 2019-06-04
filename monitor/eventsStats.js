require('dotenv').config()
const logger = require('./logger')('eventsStats')
const eventsInfo = require('./utils/events')

function compareDepositsHome(foreign) {
  return homeDeposit => {
    return (
      foreign.filter(foreignDeposit => {
        return (
          foreignDeposit.returnValues.transactionHash === homeDeposit.transactionHash &&
          foreignDeposit.returnValues.recipient === homeDeposit.returnValues.recipient &&
          foreignDeposit.returnValues.value === homeDeposit.returnValues.value
        )
      }).length === 0
    )
  }
}
function compareDepositsForeign(home) {
  return foreignDeposit => {
    return (
      home.filter(homeDeposit => {
        return (
          homeDeposit.transactionHash === foreignDeposit.returnValues.transactionHash &&
          homeDeposit.returnValues.recipient === foreignDeposit.returnValues.recipient &&
          homeDeposit.returnValues.value === foreignDeposit.returnValues.value
        )
      }).length === 0
    )
  }
}

function compareTransferHome(foreign) {
  return homeDeposit => {
    return (
      foreign.filter(foreignDeposit => {
        return (
          homeDeposit.returnValues.transactionHash === foreignDeposit.transactionHash &&
          homeDeposit.returnValues.recipient === foreignDeposit.returnValues.from &&
          homeDeposit.returnValues.value === foreignDeposit.returnValues.value
        )
      }).length === 0
    )
  }
}
function compareTransferForeign(home) {
  return foreignDeposit => {
    return (
      home.filter(homeDeposit => {
        return (
          foreignDeposit.transactionHash === homeDeposit.returnValues.transactionHash &&
          foreignDeposit.returnValues.from === homeDeposit.returnValues.recipient &&
          foreignDeposit.returnValues.value === homeDeposit.returnValues.value
        )
      }).length === 0
    )
  }
}

async function main() {
  const {
    foreignDeposits,
    homeDeposits,
    homeWithdrawals,
    foreignWithdrawals,
    isExternalErc20
  } = await eventsInfo()

  const onlyInHomeDeposits = homeDeposits.filter(compareDepositsHome(foreignDeposits))
  const onlyInForeignDeposits = foreignDeposits
    .concat([])
    .filter(compareDepositsForeign(homeDeposits))

  const onlyInHomeWithdrawals = isExternalErc20
    ? homeWithdrawals.filter(compareTransferHome(foreignWithdrawals))
    : homeWithdrawals.filter(compareDepositsForeign(foreignWithdrawals))
  const onlyInForeignWithdrawals = isExternalErc20
    ? foreignWithdrawals.filter(compareTransferForeign(homeWithdrawals))
    : foreignWithdrawals.filter(compareDepositsHome(homeWithdrawals))

  logger.debug('Done')
  return {
    onlyInHomeDeposits,
    onlyInForeignDeposits,
    onlyInHomeWithdrawals,
    onlyInForeignWithdrawals,
    lastChecked: Math.floor(Date.now() / 1000)
  }
}

module.exports = main
