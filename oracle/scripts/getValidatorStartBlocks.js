require('../env')

const { BRIDGE_VALIDATORS_ABI } = require('../../commons')
const { home, foreign } = require('../config/base.config')

async function getStartBlock(bridgeContract, web3) {
  try {
    const deployedAtBlock = await bridgeContract.methods.deployedAtBlock().call()

    const validatorContractAddress = await bridgeContract.methods.validatorContract().call()
    const validatorContract = new web3.eth.Contract(BRIDGE_VALIDATORS_ABI, validatorContractAddress)

    const validatorDeployedAtBlock = await validatorContract.methods.deployedAtBlock().call()

    const validatorAddedEvents = await validatorContract.getPastEvents('ValidatorAdded', {
      fromBlock: validatorDeployedAtBlock,
      filter: { validator: process.env.ORACLE_VALIDATOR_ADDRESS }
    })

    return validatorAddedEvents.length ? validatorAddedEvents[0].blockNumber : deployedAtBlock
  } catch (e) {
    return 0
  }
}

async function main() {
  const homeStartBlock = await getStartBlock(home.bridgeContract, home.web3)
  const foreignStartBlock = await getStartBlock(foreign.bridgeContract, foreign.web3)
  const result = {
    homeStartBlock,
    foreignStartBlock
  }
  console.log(JSON.stringify(result))
  return result
}

main()

module.exports = main
