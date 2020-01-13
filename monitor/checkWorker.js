const Web3 = require('web3')
const logger = require('./logger')('checkWorker')
const { getBridgeMode } = require('../commons')
const getBalances = require('./getBalances')
const getShortEventStats = require('./getShortEventStats')
const validators = require('./validators')
const { writeFile, createDir } = require('./utils/file')

const { COMMON_HOME_BRIDGE_ADDRESS, COMMON_HOME_RPC_URL, MONITOR_BRIDGE_NAME } = process.env

const MONITOR_VALIDATOR_HOME_TX_LIMIT = Number(process.env.MONITOR_VALIDATOR_HOME_TX_LIMIT) || 0
const MONITOR_VALIDATOR_FOREIGN_TX_LIMIT = Number(process.env.MONITOR_VALIDATOR_FOREIGN_TX_LIMIT) || 0
const MONITOR_TX_NUMBER_THRESHOLD = Number(process.env.MONITOR_TX_NUMBER_THRESHOLD) || 100

const homeProvider = new Web3.providers.HttpProvider(COMMON_HOME_RPC_URL)
const web3Home = new Web3(homeProvider)

const { HOME_ERC_TO_ERC_ABI } = require('../commons')

async function checkWorker() {
  try {
    createDir(`/responses/${MONITOR_BRIDGE_NAME}`)
    const homeBridge = new web3Home.eth.Contract(HOME_ERC_TO_ERC_ABI, COMMON_HOME_BRIDGE_ADDRESS)
    const bridgeMode = await getBridgeMode(homeBridge)
    logger.debug('Bridge mode:', bridgeMode)
    logger.debug('calling getBalances()')
    const balances = await getBalances(bridgeMode)
    logger.debug('calling getShortEventStats()')
    const events = await getShortEventStats(bridgeMode)
    const home = Object.assign({}, balances.home, events.home)
    const foreign = Object.assign({}, balances.foreign, events.foreign)
    const status = Object.assign({}, balances, events, { home }, { foreign })
    if (!status) throw new Error('status is empty: ' + JSON.stringify(status))
    writeFile(`/responses/${MONITOR_BRIDGE_NAME}/getBalances.json`, status)

    logger.debug('calling validators()')
    const vBalances = await validators(bridgeMode)
    if (!vBalances) throw new Error('vBalances is empty: ' + JSON.stringify(vBalances))

    vBalances.homeOk = true
    vBalances.foreignOk = true

    if (MONITOR_VALIDATOR_HOME_TX_LIMIT) {
      for (const hv in vBalances.home.validators) {
        if (vBalances.home.validators[hv].leftTx < MONITOR_TX_NUMBER_THRESHOLD) {
          vBalances.homeOk = false
          break
        }
      }
    }

    if (MONITOR_VALIDATOR_FOREIGN_TX_LIMIT) {
      for (const hv in vBalances.foreign.validators) {
        if (vBalances.foreign.validators[hv].leftTx < MONITOR_TX_NUMBER_THRESHOLD) {
          vBalances.foreignOk = false
          break
        }
      }
    }

    vBalances.ok = vBalances.homeOk && vBalances.foreignOk
    writeFile(`/responses/${MONITOR_BRIDGE_NAME}/validators.json`, vBalances)
    logger.debug('Done')
  } catch (e) {
    logger.error(e)
  }
}
checkWorker()
