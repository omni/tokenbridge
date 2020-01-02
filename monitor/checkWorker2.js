const fs = require('fs')
const path = require('path')
const logger = require('./logger')('checkWorker2')
const eventsStats = require('./eventsStats')
const alerts = require('./alerts')

async function checkWorker2() {
  try {
    logger.debug('calling eventsStats()')
    const evStats = await eventsStats()
    if (!evStats) throw new Error('evStats is empty: ' + JSON.stringify(evStats))
    evStats.ok =
      (evStats.onlyInHomeDeposits || evStats.home.deliveredMsgNotProcessedInForeign).length === 0 &&
      (evStats.onlyInForeignDeposits || evStats.home.processedMsgNotDeliveredInForeign).length === 0 &&
      (evStats.onlyInHomeWithdrawals || evStats.foreign.deliveredMsgNotProcessedInHome).length === 0 &&
      (evStats.onlyInForeignWithdrawals || evStats.foreign.processedMsgNotDeliveredInHome).length === 0
    fs.writeFileSync(path.join(__dirname, '/responses/eventsStats.json'), JSON.stringify(evStats, null, 4))

    logger.debug('calling alerts()')
    const _alerts = await alerts()
    if (!_alerts) throw new Error('alerts is empty: ' + JSON.stringify(_alerts))
    _alerts.ok = !_alerts.executeAffirmations.mostRecentTxHash && !_alerts.executeSignatures.mostRecentTxHash
    fs.writeFileSync(path.join(__dirname, '/responses/alerts.json'), JSON.stringify(_alerts, null, 4))
    logger.debug('Done x2')
  } catch (e) {
    logger.error(e)
  }
}
checkWorker2()
