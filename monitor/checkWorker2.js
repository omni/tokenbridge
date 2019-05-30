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
    fs.writeFileSync(
      path.join(__dirname, '/responses/eventsStats.json'),
      JSON.stringify(evStats, null, 4)
    )
    logger.debug('calling alerts()')
    const _alerts = await alerts()
    if (!_alerts) throw new Error('alerts is empty: ' + JSON.stringify(_alerts))
    fs.writeFileSync(
      path.join(__dirname, '/responses/alerts.json'),
      JSON.stringify(_alerts, null, 4)
    )
    logger.debug('Done x2')
  } catch (e) {
    logger.error(e)
  }
}
checkWorker2()
