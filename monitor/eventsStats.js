require('dotenv').config()
const eventsInfo = require('./utils/events')
const {
  processedMsgNotDelivered,
  deliveredMsgNotProcessed,
  eventWithoutReference,
  unclaimedHomeToForeignRequests
} = require('./utils/message')
const { getHomeTxSender } = require('./utils/web3Cache')
const { BRIDGE_MODES } = require('../commons')

const {
  MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST,
  MONITOR_HOME_TO_FOREIGN_BLOCK_LIST,
  MONITOR_HOME_TO_FOREIGN_CHECK_SENDER
} = process.env

async function main() {
  const {
    homeToForeignRequests,
    homeToForeignConfirmations,
    foreignToHomeConfirmations,
    foreignToHomeRequests,
    bridgeMode
  } = await eventsInfo()

  if (bridgeMode === BRIDGE_MODES.ARBITRARY_MESSAGE) {
    return {
      home: {
        deliveredMsgNotProcessedInForeign: homeToForeignRequests.filter(
          deliveredMsgNotProcessed(homeToForeignConfirmations)
        ),
        processedMsgNotDeliveredInForeign: foreignToHomeConfirmations.filter(
          processedMsgNotDelivered(foreignToHomeRequests)
        )
      },
      foreign: {
        deliveredMsgNotProcessedInHome: foreignToHomeRequests.filter(
          deliveredMsgNotProcessed(foreignToHomeConfirmations)
        ),
        processedMsgNotDeliveredInHome: homeToForeignConfirmations.filter(
          processedMsgNotDelivered(homeToForeignRequests)
        )
      },
      lastChecked: Math.floor(Date.now() / 1000)
    }
  } else {
    let onlyInHomeDeposits = homeToForeignRequests.filter(eventWithoutReference(homeToForeignConfirmations))
    const onlyInForeignDeposits = homeToForeignConfirmations.filter(eventWithoutReference(homeToForeignRequests))

    const onlyInHomeWithdrawals = foreignToHomeConfirmations.filter(eventWithoutReference(foreignToHomeRequests))
    const onlyInForeignWithdrawals = foreignToHomeRequests.filter(eventWithoutReference(foreignToHomeConfirmations))

    const unclaimedStats = {}
    if (MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST || MONITOR_HOME_TO_FOREIGN_BLOCK_LIST) {
      const unclaimedFilter = unclaimedHomeToForeignRequests()
      if (MONITOR_HOME_TO_FOREIGN_CHECK_SENDER === 'true') {
        for (let i = 0; i < onlyInHomeDeposits.length; i++) {
          onlyInHomeDeposits[i].sender = await getHomeTxSender(onlyInHomeDeposits[i].transactionHash)
        }
      }
      unclaimedStats.unclaimedHomeDeposits = onlyInHomeDeposits.filter(unclaimedFilter)
      onlyInHomeDeposits = onlyInHomeDeposits.filter(e => !unclaimedFilter(e))
    }

    return {
      onlyInHomeDeposits,
      onlyInForeignDeposits,
      onlyInHomeWithdrawals,
      onlyInForeignWithdrawals,
      ...unclaimedStats,
      lastChecked: Math.floor(Date.now() / 1000)
    }
  }
}

module.exports = main
