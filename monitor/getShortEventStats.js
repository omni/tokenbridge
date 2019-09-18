require('dotenv').config()
const eventsInfo = require('./utils/events')
const { BRIDGE_MODES } = require('../commons')

async function main(bridgeMode) {
  const { foreignDeposits, homeDeposits, homeWithdrawals, foreignWithdrawals } = await eventsInfo(bridgeMode)

  if (bridgeMode === BRIDGE_MODES.ARBITRARY_MESSAGE) {
    return {
      fromHomeToForeignDiff: homeDeposits.length - foreignDeposits.length,
      fromForeignToHomeDiff: homeWithdrawals.length - foreignWithdrawals.length,
      home: {
        toForeign: homeDeposits.length,
        fromForeign: homeWithdrawals.length
      },
      foreign: {
        fromHome: foreignDeposits.length,
        toHome: foreignWithdrawals.length
      }
    }
  } else {
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
}
module.exports = main
