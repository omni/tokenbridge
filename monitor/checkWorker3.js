require('dotenv').config()
const Web3 = require('web3')
const logger = require('./logger')('checkWorker3')
const stuckTransfers = require('./stuckTransfers')
const { writeFile, createDir } = require('./utils/file')

const { MONITOR_BRIDGE_NAME, COMMON_HOME_BRIDGE_ADDRESS, COMMON_HOME_RPC_URL } = process.env
const { getBridgeMode, HOME_NATIVE_TO_ERC_ABI, BRIDGE_MODES } = require('../commons')

const homeProvider = new Web3.providers.HttpProvider(COMMON_HOME_RPC_URL)
const web3Home = new Web3(homeProvider)

async function checkWorker3() {
  try {
    const homeBridge = new web3Home.eth.Contract(HOME_NATIVE_TO_ERC_ABI, COMMON_HOME_BRIDGE_ADDRESS)
    const bridgeMode = await getBridgeMode(homeBridge)
    if (bridgeMode === BRIDGE_MODES.NATIVE_TO_ERC_V1) {
      createDir(`/responses/${MONITOR_BRIDGE_NAME}`)
      logger.debug('calling stuckTransfers()')
      const transfers = await stuckTransfers()
      if (!transfers) throw new Error('transfers is empty: ' + JSON.stringify(transfers))
      transfers.ok = transfers.total.length === 0
      transfers.health = true
      writeFile(`/responses/${MONITOR_BRIDGE_NAME}/stuckTransfers.json`, transfers)
      logger.debug('Done')
    }
  } catch (e) {
    logger.error('checkWorker3.js', e)
  }
}
checkWorker3()
