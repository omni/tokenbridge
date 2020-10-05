require('dotenv').config()
const Web3 = require('web3')
const eventsInfo = require('./utils/events')
const { getBlockNumber } = require('./utils/contract')
const { processedMsgNotDelivered, deliveredMsgNotProcessed, eventWithoutReference } = require('./utils/message')
const { BRIDGE_MODES } = require('../commons')

const {
  COMMON_HOME_RPC_URL,
  COMMON_FOREIGN_RPC_URL,
  MONITOR_HOME_DELAY_BLOCK_TOLERANCE,
  MONITOR_FOREIGN_DELAY_BLOCK_TOLERANCE
} = process.env

const homeProvider = new Web3.providers.HttpProvider(COMMON_HOME_RPC_URL)
const web3Home = new Web3(homeProvider)

const foreignProvider = new Web3.providers.HttpProvider(COMMON_FOREIGN_RPC_URL)
const web3Foreign = new Web3(foreignProvider)

async function main() {
  const {
    homeToForeignRequests,
    homeToForeignConfirmations,
    foreignToHomeConfirmations,
    foreignToHomeRequests,
    bridgeMode
  } = await eventsInfo()

  const [homeBlockNumber, foreignBlockNumber] = await getBlockNumber(web3Home, web3Foreign)
  const homeBlocksTolerance = parseInt(MONITOR_HOME_DELAY_BLOCK_TOLERANCE || '0', 10)
  const foreignBlocksTolerance = parseInt(MONITOR_FOREIGN_DELAY_BLOCK_TOLERANCE || '0', 10)
  const tolerantHomeBlockNumber = homeBlockNumber.subn(homeBlocksTolerance)
  const tolerantForeignBlockNumber = foreignBlockNumber.subn(foreignBlocksTolerance)
  if (bridgeMode === BRIDGE_MODES.ARBITRARY_MESSAGE) {
    const deliveredMsgNotProcessedInForeign = homeToForeignRequests
      .filter(deliveredMsgNotProcessed(homeToForeignConfirmations))
      .filter(event => tolerantHomeBlockNumber.gten(event.blockNumber))
    const processedMsgNotDeliveredInForeign = foreignToHomeConfirmations.filter(
      processedMsgNotDelivered(foreignToHomeRequests)
    )
    const deliveredMsgNotProcessedInHome = foreignToHomeRequests
      .filter(deliveredMsgNotProcessed(foreignToHomeConfirmations))
      .filter(event => tolerantForeignBlockNumber.gten(event.blockNumber))
    const processedMsgNotDeliveredInHome = homeToForeignConfirmations.filter(
      processedMsgNotDelivered(homeToForeignRequests)
    )
    return {
      home: {
        deliveredMsgNotProcessedInForeign,
        processedMsgNotDeliveredInForeign
      },
      foreign: {
        deliveredMsgNotProcessedInHome,
        processedMsgNotDeliveredInHome
      },
      lastChecked: Math.floor(Date.now() / 1000)
    }
  } else {
    const onlyInHomeDeposits = homeToForeignRequests
      .filter(eventWithoutReference(homeToForeignConfirmations))
      .filter(event => tolerantHomeBlockNumber.gten(event.blockNumber))
    const onlyInForeignDeposits = homeToForeignConfirmations.filter(eventWithoutReference(homeToForeignRequests))

    const onlyInHomeWithdrawals = foreignToHomeConfirmations.filter(eventWithoutReference(foreignToHomeRequests))
    const onlyInForeignWithdrawals = foreignToHomeRequests
      .filter(eventWithoutReference(foreignToHomeConfirmations))
      .filter(event => tolerantForeignBlockNumber.gten(event.blockNumber))

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
