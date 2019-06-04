const fs = require('fs')
const path = require('path')
const Web3 = require('web3')
const logger = require('./logger')('checkWorker')
const { getBridgeMode } = require('./utils/bridgeMode')
const getBalances = require('./getBalances')
const getShortEventStats = require('./getShortEventStats')
const validators = require('./validators')

const { HOME_BRIDGE_ADDRESS, HOME_RPC_URL } = process.env
const homeProvider = new Web3.providers.HttpProvider(HOME_RPC_URL)
const web3Home = new Web3(homeProvider)

const HOME_ERC_TO_ERC_ABI = require('../contracts/build/contracts/HomeBridgeErcToErc').abi

async function checkWorker() {
  try {
    const homeBridge = new web3Home.eth.Contract(HOME_ERC_TO_ERC_ABI, HOME_BRIDGE_ADDRESS)
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
    fs.writeFileSync(
      path.join(__dirname, '/responses/getBalances.json'),
      JSON.stringify(status, null, 4)
    )

    logger.debug('calling validators()')
    const vBalances = await validators(bridgeMode)
    if (!vBalances) throw new Error('vBalances is empty: ' + JSON.stringify(vBalances))
    fs.writeFileSync(
      path.join(__dirname, '/responses/validators.json'),
      JSON.stringify(vBalances, null, 4)
    )
    logger.debug('Done')
  } catch (e) {
    logger.error(e)
  }
}
checkWorker()
