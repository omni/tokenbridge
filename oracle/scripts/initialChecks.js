require('../env')
const Web3 = require('web3')
const { ERC677_BRIDGE_TOKEN_ABI, getTokenType } = require('../../commons')

async function initialChecks() {
  const {
    FOREIGN_ERC_TO_ERC_ABI,
    ORACLE_BRIDGE_MODE,
    COMMON_FOREIGN_RPC_URL,
    COMMON_FOREIGN_BRIDGE_ADDRESS
  } = process.env
  const result = {}

  if (ORACLE_BRIDGE_MODE === 'ERC_TO_ERC') {
    const foreignWeb3 = new Web3(new Web3.providers.HttpProvider(COMMON_FOREIGN_RPC_URL))
    const bridge = new foreignWeb3.eth.Contract(FOREIGN_ERC_TO_ERC_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
    const ERC20_TOKEN_ADDRESS = await bridge.methods.erc677token().call()
    const bridgeTokenContract = new foreignWeb3.eth.Contract(ERC677_BRIDGE_TOKEN_ABI, ERC20_TOKEN_ADDRESS)

    result.foreignERC = await getTokenType(bridgeTokenContract, COMMON_FOREIGN_BRIDGE_ADDRESS)
    result.ERC20_TOKEN_ADDRESS = ERC20_TOKEN_ADDRESS
  }
  console.log(JSON.stringify(result))
  return result
}

initialChecks()

module.exports = initialChecks
