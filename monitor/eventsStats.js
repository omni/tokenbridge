require('dotenv').config()
const eventsInfo = require('./utils/events')
const { processedMsgNotDelivered, deliveredMsgNotProcessed } = require('./utils/message')
const { BRIDGE_MODES } = require('../commons')

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
    homeToForeignRequests,
    homeToForeignConfirmations,
    foreignToHomeConfirmations,
    foreignToHomeRequests,
    isExternalErc20,
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
    const onlyInHomeDeposits = homeToForeignRequests.filter(compareDepositsHome(homeToForeignConfirmations))
    const onlyInForeignDeposits = homeToForeignConfirmations
      .concat([])
      .filter(compareDepositsForeign(homeToForeignRequests))

    const onlyInHomeWithdrawals = isExternalErc20
      ? foreignToHomeConfirmations.filter(compareTransferHome(foreignToHomeRequests))
      : foreignToHomeConfirmations.filter(compareDepositsForeign(foreignToHomeRequests))
    const onlyInForeignWithdrawals = isExternalErc20
      ? foreignToHomeRequests.filter(compareTransferForeign(foreignToHomeConfirmations))
      : foreignToHomeRequests.filter(compareDepositsHome(foreignToHomeConfirmations))

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
