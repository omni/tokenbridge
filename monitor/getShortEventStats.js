require('dotenv').config()
const BN = require('bignumber.js')
const Web3Utils = require('web3').utils
const {
  eventWithoutReference,
  deliveredMsgNotProcessed,
  unclaimedHomeToForeignRequests,
  manuallyProcessedAMBHomeToForeignRequests
} = require('./utils/message')
const { BRIDGE_MODES } = require('../commons')
const getRequestsOutOfLimits = require('./getRequestsOutOfLimits')
const { getHomeTxSender } = require('./utils/web3Cache')

const {
  MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST,
  MONITOR_HOME_TO_FOREIGN_BLOCK_LIST,
  MONITOR_HOME_TO_FOREIGN_CHECK_SENDER
} = process.env

async function main(bridgeMode, eventsInfo) {
  const {
    homeToForeignConfirmations,
    homeToForeignRequests,
    foreignToHomeConfirmations,
    foreignToHomeRequests
  } = eventsInfo

  if (bridgeMode === BRIDGE_MODES.ARBITRARY_MESSAGE) {
    const onlyInHomeRequests = homeToForeignRequests.filter(deliveredMsgNotProcessed(homeToForeignConfirmations))
    const manuallyProcessedRequests = onlyInHomeRequests.filter(manuallyProcessedAMBHomeToForeignRequests())
    return {
      fromHomeToForeignDiff:
        homeToForeignRequests.length - homeToForeignConfirmations.length - manuallyProcessedRequests.length,
      fromHomeToForeignPBUDiff: manuallyProcessedRequests.length,
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
    const stats = {
      depositsDiff: homeToForeignRequests.length - homeToForeignConfirmations.length,
      withdrawalDiff: foreignToHomeConfirmations.length - foreignToHomeRequests.length
    }

    const onlyInHomeDeposits = homeToForeignRequests.filter(eventWithoutReference(homeToForeignConfirmations))
    const onlyInForeignWithdrawals = foreignToHomeRequests.filter(eventWithoutReference(foreignToHomeConfirmations))

    if (MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST || MONITOR_HOME_TO_FOREIGN_BLOCK_LIST) {
      if (MONITOR_HOME_TO_FOREIGN_CHECK_SENDER === 'true') {
        for (let i = 0; i < onlyInHomeDeposits.length; i++) {
          onlyInHomeDeposits[i].sender = await getHomeTxSender(onlyInHomeDeposits[i].transactionHash)
        }
      }

      const unclaimedPool = onlyInHomeDeposits.filter(unclaimedHomeToForeignRequests())

      stats.depositsDiff -= unclaimedPool.length
      stats.unclaimedDiff = unclaimedPool.length
      stats.unclaimedBalance = Web3Utils.fromWei(BN.sum(0, ...unclaimedPool.map(e => e.value)).toFixed())
    }

    const limitsStats = await getRequestsOutOfLimits(bridgeMode, {
      homeRequests: onlyInHomeDeposits,
      foreignRequests: onlyInForeignWithdrawals
    })

    return {
      ...stats,
      home: {
        deposits: homeToForeignRequests.length,
        withdrawals: foreignToHomeConfirmations.length,
        outOfLimits: limitsStats.home
      },
      foreign: {
        deposits: homeToForeignConfirmations.length,
        withdrawals: foreignToHomeRequests.length,
        outOfLimits: limitsStats.foreign
      }
    }
  }
}
module.exports = main
