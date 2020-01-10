const logger = require('./logger')('checkWorker3')
const stuckTransfers = require('./stuckTransfers')
const { writeFile, createDir } = require('./utils/file')

const { MONITOR_BRIDGE_NAME } = process.env

async function checkWorker3() {
  try {
    createDir(`/responses/${MONITOR_BRIDGE_NAME}`)
    logger.debug('calling stuckTransfers()')
    const transfers = await stuckTransfers()
    // console.log(transfers)
    if (!transfers) throw new Error('transfers is empty: ' + JSON.stringify(transfers))
    transfers.ok = transfers.total.length === 0
    writeFile(`/responses/${MONITOR_BRIDGE_NAME}/stuckTransfers.json`, transfers)
    logger.debug('Done')
  } catch (e) {
    logger.error('checkWorker3.js', e)
  }
}
checkWorker3()
