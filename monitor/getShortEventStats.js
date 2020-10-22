require('dotenv').config()
const BN = require('bignumber.js')
const Web3Utils = require('web3').utils
const eventsInfo = require('./utils/events')
const { eventWithoutReference, unclaimedHomeToForeignRequests } = require('./utils/message')
const { BRIDGE_MODES } = require('../commons')

const { MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST, MONITOR_HOME_TO_FOREIGN_BLOCK_LIST } = process.env

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
    const unclaimedStats = {}
    if (MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST || MONITOR_HOME_TO_FOREIGN_BLOCK_LIST) {
      const unclaimedPool = homeToForeignRequests
        .filter(eventWithoutReference(homeToForeignConfirmations))
        .filter(unclaimedHomeToForeignRequests())

      unclaimedStats.unclaimed = unclaimedPool.length
      unclaimedStats.unclaimedDiff = Web3Utils.fromWei(BN.sum(...unclaimedPool.map(e => e.value)).toFixed())
    }
    return {
      depositsDiff: homeToForeignRequests.length - homeToForeignConfirmations.length,
      withdrawalDiff: foreignToHomeConfirmations.length - foreignToHomeRequests.length,
      ...unclaimedStats,
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
