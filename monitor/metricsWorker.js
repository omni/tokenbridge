require('dotenv').config()
const logger = require('./logger')('metricsWorker')
const { writeFile, createDir } = require('./utils/file')
const getPrometheusMetrics = require('./prometheusMetrics')

const { MONITOR_BRIDGE_NAME } = process.env

async function metricsWorker() {
  try {
    createDir(`/responses/${MONITOR_BRIDGE_NAME}`)
    logger.debug('calling getPrometheusMetrics()')
    const metrics = await getPrometheusMetrics(MONITOR_BRIDGE_NAME)
    if (!metrics) throw new Error('metrics is empty: ' + JSON.stringify(metrics))
    writeFile(`/responses/${MONITOR_BRIDGE_NAME}/metrics.txt`, metrics, { stringify: false })
    logger.debug('Done')
  } catch (e) {
    logger.error(e)
  }
}
metricsWorker()
