require('dotenv').config()
const logger = require('./logger')('stuckTransfers.js')
const { isHomeContract, isForeignContract } = require('./utils/web3Cache')
const eventsInfo = require('./utils/events')
const { normalizeAMBMessageEvent } = require('../commons')

function countInteractions(requests) {
  const stats = {}
  requests.forEach(msg => {
    if (!stats[msg.sender]) {
      stats[msg.sender] = {}
    }
    if (stats[msg.sender][msg.executor]) {
      stats[msg.sender][msg.executor] += 1
    } else {
      stats[msg.sender][msg.executor] = 1
    }
  })
  return stats
}

async function main(mode) {
  const { homeToForeignRequests, foreignToHomeRequests } = await eventsInfo(mode)
  const homeToForeign = homeToForeignRequests.map(normalizeAMBMessageEvent)
  for (const event of homeToForeign) {
    event.isMediatorInteraction = (await isHomeContract(event.sender)) && (await isForeignContract(event.executor))
  }
  const foreignToHome = foreignToHomeRequests.map(normalizeAMBMessageEvent)
  for (const event of foreignToHome) {
    event.isMediatorInteraction = (await isHomeContract(event.executor)) && (await isForeignContract(event.sender))
  }

  const homeToForeignMediatorsStats = countInteractions(homeToForeign.filter(event => event.isMediatorInteraction))
  const foreignToHomeMediatorsStats = countInteractions(foreignToHome.filter(event => event.isMediatorInteraction))

  const fullDuplexMediators = []
  const halfDuplexMediators = {
    home: [],
    foreign: []
  }
  for (const homeMediator of Object.keys(homeToForeignMediatorsStats)) {
    const homeStats = homeToForeignMediatorsStats[homeMediator]

    for (const foreignMediator of Object.keys(homeStats)) {
      const foreignStats = foreignToHomeMediatorsStats[foreignMediator]

      if (foreignStats && foreignStats[homeMediator]) {
        fullDuplexMediators.push({
          homeMediator,
          foreignMediator,
          homeToForeignRequests: homeStats[foreignMediator],
          foreignToHomeRequests: foreignStats[homeMediator]
        })
      } else {
        halfDuplexMediators.home.push({
          homeMediator,
          foreignMediator,
          homeToForeignRequests: homeStats[foreignMediator]
        })
      }
    }
  }

  for (const foreignMediator of Object.keys(foreignToHomeMediatorsStats)) {
    const foreignStats = foreignToHomeMediatorsStats[foreignMediator]
    for (const homeMediator of Object.keys(foreignStats)) {
      const homeStats = homeToForeignMediatorsStats[homeMediator]

      if (!homeStats || !homeStats[foreignMediator]) {
        halfDuplexMediators.foreign.push({
          homeMediator,
          foreignMediator,
          foreignToHomeRequests: foreignStats[homeMediator]
        })
      }
    }
  }

  logger.debug('Done')
  return {
    fullDuplexMediators,
    halfDuplexMediators
  }
}
module.exports = main
