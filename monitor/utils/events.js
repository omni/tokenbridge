require('dotenv').config()
const Web3 = require('web3')
const { toBN } = require('web3').utils
const logger = require('../logger')('eventsUtils')
const { BRIDGE_MODES, getBridgeMode, getBridgeABIs, ERC_TYPES } = require('./bridgeMode')
const { getTokenType } = require('./ercUtils')

const { HOME_RPC_URL, FOREIGN_RPC_URL, HOME_BRIDGE_ADDRESS, FOREIGN_BRIDGE_ADDRESS } = process.env
const HOME_DEPLOYMENT_BLOCK = toBN(Number(process.env.HOME_DEPLOYMENT_BLOCK) || 0)
const FOREIGN_DEPLOYMENT_BLOCK = toBN(Number(process.env.FOREIGN_DEPLOYMENT_BLOCK) || 0)

const homeProvider = new Web3.providers.HttpProvider(HOME_RPC_URL)
const web3Home = new Web3(homeProvider)

const foreignProvider = new Web3.providers.HttpProvider(FOREIGN_RPC_URL)
const web3Foreign = new Web3(foreignProvider)

const HOME_ERC_TO_ERC_ABI = require('../../contracts/build/contracts/HomeBridgeErcToErc').abi
const ERC20_ABI = require('../../contracts/build/contracts/ERC20').abi
const { getPastEvents, getBlockNumber } = require('./contract')

async function main(mode) {
  const homeErcBridge = new web3Home.eth.Contract(HOME_ERC_TO_ERC_ABI, HOME_BRIDGE_ADDRESS)
  const bridgeMode = mode || (await getBridgeMode(homeErcBridge))
  const { HOME_ABI, FOREIGN_ABI } = getBridgeABIs(bridgeMode)
  const homeBridge = new web3Home.eth.Contract(HOME_ABI, HOME_BRIDGE_ADDRESS)
  const foreignBridge = new web3Foreign.eth.Contract(FOREIGN_ABI, FOREIGN_BRIDGE_ADDRESS)
  const tokenType = await getTokenType(foreignBridge, FOREIGN_BRIDGE_ADDRESS)
  const isExternalErc20 = tokenType === ERC_TYPES.ERC20
  const v1Bridge = bridgeMode === BRIDGE_MODES.NATIVE_TO_ERC_V1
  const erc20MethodName =
    bridgeMode === BRIDGE_MODES.NATIVE_TO_ERC || v1Bridge ? 'erc677token' : 'erc20token'
  const erc20Address = await foreignBridge.methods[erc20MethodName]().call()
  const erc20Contract = new web3Foreign.eth.Contract(ERC20_ABI, erc20Address)

  logger.debug('getting last block numbers')
  const [homeBlockNumber, foreignBlockNumber] = await getBlockNumber(web3Home, web3Foreign)

  logger.debug("calling homeBridge.getPastEvents('UserRequestForSignature')")
  const homeDeposits = await getPastEvents({
    contract: homeBridge,
    event: v1Bridge ? 'Deposit' : 'UserRequestForSignature',
    fromBlock: HOME_DEPLOYMENT_BLOCK,
    toBlock: homeBlockNumber,
    options: {}
  })

  logger.debug("calling foreignBridge.getPastEvents('RelayedMessage')")
  const foreignDeposits = await getPastEvents({
    contract: foreignBridge,
    event: v1Bridge ? 'Deposit' : 'RelayedMessage',
    fromBlock: FOREIGN_DEPLOYMENT_BLOCK,
    toBlock: foreignBlockNumber,
    options: {}
  })

  logger.debug("calling homeBridge.getPastEvents('AffirmationCompleted')")
  const homeWithdrawals = await getPastEvents({
    contract: homeBridge,
    event: v1Bridge ? 'Withdraw' : 'AffirmationCompleted',
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
        event: v1Bridge ? 'Withdraw' : 'UserRequestForAffirmation',
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
}

module.exports = main
