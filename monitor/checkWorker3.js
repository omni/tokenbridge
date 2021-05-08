require('dotenv').config()
const logger = require('./logger')('checkWorker3')
const detectMediators = require('./detectMediators')
const detectFailures = require('./detectFailures')
const { writeFile, createDir } = require('./utils/file')
const { web3Home } = require('./utils/web3')
const { saveCache } = require('./utils/web3Cache')

const { MONITOR_BRIDGE_NAME, COMMON_HOME_BRIDGE_ADDRESS } = process.env
const { getBridgeMode, HOME_ERC_TO_NATIVE_ABI, BRIDGE_MODES } = require('../commons')

async function checkWorker3() {
  try {
    const homeBridge = new web3Home.eth.Contract(HOME_ERC_TO_NATIVE_ABI, COMMON_HOME_BRIDGE_ADDRESS)
    const bridgeMode = await getBridgeMode(homeBridge)
    if (bridgeMode === BRIDGE_MODES.ARBITRARY_MESSAGE) {
      createDir(`/responses/${MONITOR_BRIDGE_NAME}`)

      logger.debug('calling detectMediators()')
      const mediators = await detectMediators(bridgeMode)
      mediators.ok = true
      mediators.health = true
      writeFile(`/responses/${MONITOR_BRIDGE_NAME}/mediators.json`, mediators)

      logger.debug('calling detectFailures()')
      const failures = await detectFailures(bridgeMode)
      failures.ok = true
      failures.health = true
      writeFile(`/responses/${MONITOR_BRIDGE_NAME}/failures.json`, failures)

      saveCache()
      logger.debug('Done')
    }
  } catch (e) {
    logger.error('checkWorker3.js', e)
  }
}
checkWorker3()
