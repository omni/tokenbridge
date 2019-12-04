require('../env')
const Web3 = require('web3')
const { getTokensState } = require('../src/events/processTransfers/tokenState')
const {
  ERC677_BRIDGE_TOKEN_ABI,
  FOREIGN_ERC_TO_ERC_ABI,
  FOREIGN_ERC_TO_NATIVE_ABI,
  getTokenType
} = require('../../commons')

async function initialChecks() {
  const { ORACLE_BRIDGE_MODE, COMMON_FOREIGN_RPC_URL, COMMON_FOREIGN_BRIDGE_ADDRESS } = process.env
  let result = {}
  const foreignWeb3 = new Web3(new Web3.providers.HttpProvider(COMMON_FOREIGN_RPC_URL))

  if (ORACLE_BRIDGE_MODE === 'ERC_TO_ERC') {
    const bridge = new foreignWeb3.eth.Contract(FOREIGN_ERC_TO_ERC_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
    result.bridgeableTokenAddress = await bridge.methods.erc20token().call()
  } else if (ORACLE_BRIDGE_MODE === 'ERC_TO_NATIVE') {
    const bridge = new foreignWeb3.eth.Contract(FOREIGN_ERC_TO_NATIVE_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
    result = await getTokensState(bridge)
  }

  if (ORACLE_BRIDGE_MODE === 'ERC_TO_ERC') {
    const bridgeTokenContract = new foreignWeb3.eth.Contract(ERC677_BRIDGE_TOKEN_ABI, result.bridgeableTokenAddress)
    result.foreignERC = await getTokenType(bridgeTokenContract, COMMON_FOREIGN_BRIDGE_ADDRESS)
  }
  console.log(JSON.stringify(result))
  return result
}

initialChecks()

module.exports = initialChecks
