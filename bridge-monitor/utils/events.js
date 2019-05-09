require('dotenv').config()
const Web3 = require('web3')
const { toBN } = require('web3').utils
const logger = require('../logger')('eventsUtils')
const { BRIDGE_MODES, decodeBridgeMode, getBridgeABIs, ERC_TYPES } = require('./bridgeMode')
const { getTokenType } = require('./ercUtils')

const { HOME_RPC_URL, FOREIGN_RPC_URL, HOME_BRIDGE_ADDRESS, FOREIGN_BRIDGE_ADDRESS } = process.env
const HOME_DEPLOYMENT_BLOCK = toBN(Number(process.env.HOME_DEPLOYMENT_BLOCK) || 0)
const FOREIGN_DEPLOYMENT_BLOCK = toBN(Number(process.env.FOREIGN_DEPLOYMENT_BLOCK) || 0)

const homeProvider = new Web3.providers.HttpProvider(HOME_RPC_URL)
const web3Home = new Web3(homeProvider)

const foreignProvider = new Web3.providers.HttpProvider(FOREIGN_RPC_URL)
const web3Foreign = new Web3(foreignProvider)

const HOME_ERC_TO_ERC_ABI = require('../abis/HomeBridgeErcToErc.abi')
const ERC20_ABI = require('../abis/ERC20.abi')
const { getPastEvents, getBlockNumber } = require('./contract')

async function main() {
  try {
    const homeErcBridge = new web3Home.eth.Contract(HOME_ERC_TO_ERC_ABI, HOME_BRIDGE_ADDRESS)
    const bridgeModeHash = await homeErcBridge.methods.getBridgeMode().call()
    const bridgeMode = decodeBridgeMode(bridgeModeHash)
    const { HOME_ABI, FOREIGN_ABI } = getBridgeABIs(bridgeMode)
    const homeBridge = new web3Home.eth.Contract(HOME_ABI, HOME_BRIDGE_ADDRESS)
    const foreignBridge = new web3Foreign.eth.Contract(FOREIGN_ABI, FOREIGN_BRIDGE_ADDRESS)
    const tokenType = await getTokenType(foreignBridge, FOREIGN_BRIDGE_ADDRESS)
    const isExternalErc20 = tokenType === ERC_TYPES.ERC20
    const erc20MethodName = bridgeMode === BRIDGE_MODES.NATIVE_TO_ERC ? 'erc677token' : 'erc20token'
    const erc20Address = await foreignBridge.methods[erc20MethodName]().call()
    const erc20Contract = new web3Foreign.eth.Contract(ERC20_ABI, erc20Address)

    logger.debug('getting last block numbers')
    const [homeBlockNumber, foreignBlockNumber] = await getBlockNumber(web3Home, web3Foreign)

    logger.debug("calling homeBridge.getPastEvents('UserRequestForSignature')")
    const homeDeposits = await getPastEvents({
      contract: homeBridge,
      event: 'UserRequestForSignature',
      fromBlock: HOME_DEPLOYMENT_BLOCK,
      toBlock: homeBlockNumber,
      options: {}
    })

    logger.debug("calling foreignBridge.getPastEvents('RelayedMessage')")
    const foreignDeposits = await getPastEvents({
      contract: foreignBridge,
      event: 'RelayedMessage',
      fromBlock: FOREIGN_DEPLOYMENT_BLOCK,
      toBlock: foreignBlockNumber,
      options: {}
    })

    logger.debug("calling homeBridge.getPastEvents('AffirmationCompleted')")
    const homeWithdrawals = await getPastEvents({
      contract: homeBridge,
      event: 'AffirmationCompleted',
      fromBlock: HOME_DEPLOYMENT_BLOCK,
      toBlock: homeBlockNumber,
      options: {}
    })

    logger.debug("calling foreignBridge.getPastEvents('UserRequestForAffirmation')")
    const foreignWithdrawals = isExternalErc20
      ? await getPastEvents({
          contract: erc20Contract,
          event: 'Transfer',
          fromBlock: FOREIGN_DEPLOYMENT_BLOCK,
          toBlock: foreignBlockNumber,
          options: {
            filter: { to: FOREIGN_BRIDGE_ADDRESS }
          }
        })
      : await getPastEvents({
          contract: foreignBridge,
          event: 'UserRequestForAffirmation',
          fromBlock: FOREIGN_DEPLOYMENT_BLOCK,
          toBlock: foreignBlockNumber,
          options: {}
        })
    logger.debug('Done')
    return {
      homeDeposits,
      foreignDeposits,
      homeWithdrawals,
      foreignWithdrawals,
      isExternalErc20
    }
  } catch (e) {
    logger.error(e)
    throw e
  }
}

module.exports = main
