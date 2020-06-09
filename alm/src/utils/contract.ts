import { Contract } from 'web3-eth-contract'

export const getRequiredBlockConfirmations = async (contract: Contract) => {
  const blockConfirmations = await contract.methods.requiredBlockConfirmations().call()
  return parseInt(blockConfirmations)
}

export const getValidatorAddress = (contract: Contract) => contract.methods.validatorContract().call()

export const getRequiredSignatures = async (contract: Contract) => {
  const requiredSignatures = await contract.methods.requiredSignatures().call()
  return parseInt(requiredSignatures)
}

export const getValidatorList = (contract: Contract) => contract.methods.validatorList().call()
