const Web3 = require('web3')
const { getBridgeMode, BRIDGE_MODES } = require('./bridgeMode')
const HOME_ERC_TO_ERC_ABI = require('../../contracts/build/contracts/HomeBridgeErcToErc').abi

const { HOME_BRIDGE_ADDRESS, HOME_RPC_URL } = process.env
const homeProvider = new Web3.providers.HttpProvider(HOME_RPC_URL)
const web3Home = new Web3(homeProvider)

async function isV1Bridge() {
  const homeBridge = new web3Home.eth.Contract(HOME_ERC_TO_ERC_ABI, HOME_BRIDGE_ADDRESS)
  const bridgeMode = await getBridgeMode(homeBridge)
  return bridgeMode === BRIDGE_MODES.NATIVE_TO_ERC_V1
}

module.exports = {
  isV1Bridge
}
