const { BRIDGE_VALIDATORS_ABI } = require('../../commons')

const setRequiredSignatures = async ({ bridgeContract, web3, requiredSignatures, options }) => {
  const validatorAddress = await bridgeContract.methods.validatorContract().call()
  const validatorContract = new web3.eth.Contract(BRIDGE_VALIDATORS_ABI, validatorAddress)

  return validatorContract.methods.setRequiredSignatures(requiredSignatures).send(options)
}

module.exports = {
  setRequiredSignatures
}
