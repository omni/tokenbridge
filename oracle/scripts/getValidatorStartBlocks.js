require('../env')

const { BRIDGE_VALIDATORS_ABI } = require('../../commons')
const { web3Home, web3Foreign } = require('../src/services/web3')
const { bridgeConfig } = require('../config/base.config')

const homeABI = bridgeConfig.homeBridgeAbi
const foreignABI = bridgeConfig.foreignBridgeAbi

async function getStartBlock(web3, bridgeAddress, bridgeAbi) {
  try {
    const bridgeContract = new web3.eth.Contract(bridgeAbi, bridgeAddress)

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
  const { COMMON_HOME_BRIDGE_ADDRESS, COMMON_FOREIGN_BRIDGE_ADDRESS } = process.env

  const homeStartBlock = await getStartBlock(web3Home, COMMON_HOME_BRIDGE_ADDRESS, homeABI)
  const foreignStartBlock = await getStartBlock(web3Foreign, COMMON_FOREIGN_BRIDGE_ADDRESS, foreignABI)
  const result = {
    homeStartBlock,
    foreignStartBlock
  }
  console.log(JSON.stringify(result))
  return result
}

main()

module.exports = main
