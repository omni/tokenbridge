require('dotenv').config()
const eventsInfo = require('./utils/events')

async function main(bridgeMode) {
  const { foreignDeposits, homeDeposits, homeWithdrawals, foreignWithdrawals } = await eventsInfo(
    bridgeMode
  )

  return {
    depositsDiff: homeDeposits.length - foreignDeposits.length,
    withdrawalDiff: homeWithdrawals.length - foreignWithdrawals.length,
    home: {
      deposits: homeDeposits.length,
      withdrawals: homeWithdrawals.length
    },
    foreign: {
      deposits: foreignDeposits.length,
      withdrawals: foreignWithdrawals.length
    }
  }
}
module.exports = main
