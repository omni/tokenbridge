require('dotenv').config()
const eventsInfo = require('./utils/events')
const { processedMsgNotDelivered, deliveredMsgNotProcessed, eventWithoutReference } = require('./utils/message')
const { BRIDGE_MODES } = require('../commons')

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
    const onlyInHomeDeposits = homeToForeignRequests.filter(eventWithoutReference(homeToForeignConfirmations))
    const onlyInForeignDeposits = homeToForeignConfirmations.filter(eventWithoutReference(homeToForeignRequests))

    const onlyInHomeWithdrawals = foreignToHomeConfirmations.filter(eventWithoutReference(foreignToHomeRequests))
    const onlyInForeignWithdrawals = foreignToHomeRequests.filter(eventWithoutReference(foreignToHomeConfirmations))

    return {
      onlyInHomeDeposits,
      onlyInForeignDeposits,
      onlyInHomeWithdrawals,
      onlyInForeignWithdrawals,
      lastChecked: Math.floor(Date.now() / 1000)
    }
  }
}

module.exports = main
