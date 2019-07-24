require('../env')
const Web3 = require('web3')
const { getTokenType } = require('../../commons')

async function initialChecks() {
  const { ERC20_TOKEN_ADDRESS, BRIDGE_MODE, FOREIGN_RPC_URL, FOREIGN_BRIDGE_ADDRESS } = process.env
  const result = {}

  if (BRIDGE_MODE === 'ERC_TO_ERC') {
    const foreignWeb3 = new Web3(new Web3.providers.HttpProvider(FOREIGN_RPC_URL))
    result.foreignERC = await getTokenType(foreignWeb3, ERC20_TOKEN_ADDRESS, FOREIGN_BRIDGE_ADDRESS)
  }
  console.log(JSON.stringify(result))
  return result
}

initialChecks()

module.exports = initialChecks
