require('../env')
const { getTokensState } = require('../src/utils/tokenState')
const {
  ERC677_BRIDGE_TOKEN_ABI,
  FOREIGN_ERC_TO_ERC_ABI,
  FOREIGN_ERC_TO_NATIVE_ABI,
  getTokenType
} = require('../../commons')
const { web3Foreign } = require('../src/services/web3')

const emptyLogger = {
  debug: () => {},
  info: () => {}
}

async function initialChecks() {
  const { ORACLE_BRIDGE_MODE, COMMON_FOREIGN_BRIDGE_ADDRESS } = process.env
  let result = {}

  if (ORACLE_BRIDGE_MODE === 'ERC_TO_ERC') {
    const bridge = new web3Foreign.eth.Contract(FOREIGN_ERC_TO_ERC_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
    result.bridgeableTokenAddress = await bridge.methods.erc20token().call()
  } else if (ORACLE_BRIDGE_MODE === 'ERC_TO_NATIVE') {
    const bridge = new web3Foreign.eth.Contract(FOREIGN_ERC_TO_NATIVE_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
    result = await getTokensState(bridge, emptyLogger)
  }

  if (ORACLE_BRIDGE_MODE === 'ERC_TO_ERC') {
    const bridgeTokenContract = new web3Foreign.eth.Contract(ERC677_BRIDGE_TOKEN_ABI, result.bridgeableTokenAddress)
    result.foreignERC = await getTokenType(bridgeTokenContract, COMMON_FOREIGN_BRIDGE_ADDRESS)
  }
  console.log(JSON.stringify(result))
  return result
}

const result = initialChecks()

module.exports = result
