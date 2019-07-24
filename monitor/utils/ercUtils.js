const { ERC_TYPES } = require('../../commons')

const getTokenType = async (contract, bridgeAddress) => {
  const bridgeContract = await contract.methods.bridgeContract().call()
  if (bridgeContract === bridgeAddress) {
    return ERC_TYPES.ERC677
  } else {
    return ERC_TYPES.ERC20
  }
}

module.exports = {
  getTokenType
}
