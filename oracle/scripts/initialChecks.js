require('../env')
const { getTokensState } = require('../src/utils/tokenState')
const { FOREIGN_ERC_TO_NATIVE_ABI } = require('../../commons')
const { web3Foreign } = require('../src/services/web3')

const emptyLogger = {
  debug: () => {},
  info: () => {}
}

async function initialChecks() {
  const { ORACLE_BRIDGE_MODE, COMMON_FOREIGN_BRIDGE_ADDRESS } = process.env
  let result = {}

  if (ORACLE_BRIDGE_MODE === 'ERC_TO_NATIVE') {
    const bridge = new web3Foreign.eth.Contract(FOREIGN_ERC_TO_NATIVE_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
    result = await getTokensState(bridge, emptyLogger)
  }

  console.log(JSON.stringify(result))
  return result
}

const result = initialChecks()

module.exports = result
