const { ERC_TYPES } = require('./bridgeMode')

const getTokenType = async (contract, bridgeAddress) => {
  try {
    const bridgeContract = await contract.methods.bridgeContract().call()
    if (bridgeContract === bridgeAddress) {
      return ERC_TYPES.ERC677
    } else {
      return ERC_TYPES.ERC20
    }
  } catch (e) {
    return ERC_TYPES.ERC20
  }
}

module.exports = {
  getTokenType
}
