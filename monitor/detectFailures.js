require('dotenv').config()
const logger = require('./logger')('detectFailures.js')
const eventsInfo = require('./utils/events')
const { normalizeAMBMessageEvent } = require('../commons')
const { getHomeBlockNumber, getForeignBlockNumber } = require('./utils/web3')

function normalize(events) {
  const requests = {}
  events.forEach(event => {
    const request = normalizeAMBMessageEvent(event)
    request.requestTx = event.transactionHash
    requests[request.messageId] = request
  })
  return confirmation => {
    const request = requests[confirmation.returnValues.messageId] || {}
    return {
      ...request,
      status: false,
      executionTx: confirmation.transactionHash,
      executionBlockNumber: confirmation.blockNumber
    }
  }
}

async function main(mode) {
  const {
    homeToForeignRequests,
    homeToForeignConfirmations,
    foreignToHomeConfirmations,
    foreignToHomeRequests
  } = await eventsInfo(mode)
  const hasFailed = event => !event.returnValues.status
  const cmp = (a, b) => b.executionBlockNumber - a.executionBlockNumber
  const failedForeignToHomeMessages = foreignToHomeConfirmations
    .filter(hasFailed)
    .map(normalize(foreignToHomeRequests))
    .sort(cmp)
  const failedHomeToForeignMessages = homeToForeignConfirmations
    .filter(hasFailed)
    .map(normalize(homeToForeignRequests))
    .sort(cmp)

  const homeBlockNumber = await getHomeBlockNumber()
  const foreignBlockNumber = await getForeignBlockNumber()

  const blockRanges = [1000, 10000, 100000, 1000000]
  const rangeNames = [
    `last${blockRanges[0]}blocks`,
    ...blockRanges.slice(0, blockRanges.length - 1).map((n, i) => `last${n}to${blockRanges[i + 1]}blocks`),
    `before${blockRanges[blockRanges.length - 1]}blocks`
  ]

  const countFailures = (failedMessages, lastBlockNumber) => {
    const result = {}
    rangeNames.forEach(name => {
      result[name] = 0
    })
    failedMessages.forEach(message => {
      const blockAge = lastBlockNumber - message.executionBlockNumber
      let rangeIndex = blockRanges.findIndex(n => n > blockAge)
      if (rangeIndex === -1) {
        rangeIndex = blockRanges.length
      }
      result[rangeNames[rangeIndex]] += 1
    })
    return result
  }

  logger.debug('Done')

  return {
    homeToForeign: {
      total: failedHomeToForeignMessages.length,
      stats: countFailures(failedHomeToForeignMessages, foreignBlockNumber),
      lastFailures: failedHomeToForeignMessages.slice(0, 5)
    },
    foreignToHome: {
      total: failedForeignToHomeMessages.length,
      stats: countFailures(failedForeignToHomeMessages, homeBlockNumber),
      lastFailures: failedForeignToHomeMessages.slice(0, 5)
    },
    lastChecked: Math.floor(Date.now() / 1000)
  }
}

module.exports = main
