require('dotenv').config()
const eventsInfo = require('./utils/events')
const { BRIDGE_MODES } = require('../commons')

async function main(bridgeMode) {
  const {
    homeToForeignConfirmations,
    homeToForeignRequests,
    foreignToHomeConfirmations,
    foreignToHomeRequests
  } = await eventsInfo(bridgeMode)

  if (bridgeMode === BRIDGE_MODES.ARBITRARY_MESSAGE) {
    return {
      fromHomeToForeignDiff: homeToForeignRequests.length - homeToForeignConfirmations.length,
      fromForeignToHomeDiff: foreignToHomeConfirmations.length - foreignToHomeRequests.length,
      home: {
        toForeign: homeToForeignRequests.length,
        fromForeign: foreignToHomeConfirmations.length
      },
      foreign: {
        fromHome: homeToForeignConfirmations.length,
        toHome: foreignToHomeRequests.length
      }
    }
  } else {
    return {
      depositsDiff: homeToForeignRequests.length - homeToForeignConfirmations.length,
      withdrawalDiff: foreignToHomeConfirmations.length - foreignToHomeRequests.length,
      home: {
        deposits: homeToForeignRequests.length,
        withdrawals: foreignToHomeConfirmations.length
      },
      foreign: {
        deposits: homeToForeignConfirmations.length,
        withdrawals: foreignToHomeRequests.length
      }
    }
  }
}
module.exports = main
