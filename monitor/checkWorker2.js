require('dotenv').config()
const logger = require('./logger')('checkWorker2')
const eventsStats = require('./eventsStats')
const alerts = require('./alerts')
const { writeFile, createDir } = require('./utils/file')
const { saveCache } = require('./utils/web3Cache')

const { MONITOR_BRIDGE_NAME } = process.env

async function checkWorker2() {
  try {
    createDir(`/responses/${MONITOR_BRIDGE_NAME}`)
    logger.debug('calling eventsStats()')
    const evStats = await eventsStats()
    if (!evStats) throw new Error('evStats is empty: ' + JSON.stringify(evStats))
    evStats.ok =
      (evStats.onlyInHomeDeposits || evStats.home.deliveredMsgNotProcessedInForeign).length === 0 &&
      (evStats.onlyInForeignDeposits || evStats.home.processedMsgNotDeliveredInForeign).length === 0 &&
      (evStats.onlyInHomeWithdrawals || evStats.foreign.deliveredMsgNotProcessedInHome).length === 0 &&
      (evStats.onlyInForeignWithdrawals || evStats.foreign.processedMsgNotDeliveredInHome).length === 0
    evStats.health = true
    writeFile(`/responses/${MONITOR_BRIDGE_NAME}/eventsStats.json`, evStats)

    logger.debug('calling alerts()')
    const _alerts = await alerts()
    if (!_alerts) throw new Error('alerts is empty: ' + JSON.stringify(_alerts))
    _alerts.ok = !_alerts.executeAffirmations.mostRecentTxHash && !_alerts.executeSignatures.mostRecentTxHash
    _alerts.health = true
    writeFile(`/responses/${MONITOR_BRIDGE_NAME}/alerts.json`, _alerts)
    saveCache()
    logger.debug('Done x2')
  } catch (e) {
    logger.error(e)
  }
}
checkWorker2()
