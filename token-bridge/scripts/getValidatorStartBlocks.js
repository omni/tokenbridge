const path = require('path')
require('dotenv').config({
  path: path.join(__dirname, '../.env')
})
const Web3 = require('web3')
const bridgeValidatorsABI = require('../abis/BridgeValidators.abi')

const rpcUrlsManager = require('../src/services/getRpcUrlsManager')

const { bridgeConfig } = require('../config/base.config')

const homeABI = bridgeConfig.homeBridgeAbi
const foreignABI = bridgeConfig.foreignBridgeAbi

async function getStartBlock(rpcUrl, bridgeAddress, bridgeAbi) {
  try {
    const web3Provider = new Web3.providers.HttpProvider(rpcUrl)
    const web3Instance = new Web3(web3Provider)
    const bridgeContract = new web3Instance.eth.Contract(bridgeAbi, bridgeAddress)

    const deployedAtBlock = await bridgeContract.methods.deployedAtBlock().call()

    const validatorContractAddress = await bridgeContract.methods.validatorContract().call()
    const validatorContract = new web3Instance.eth.Contract(
      bridgeValidatorsABI,
      validatorContractAddress
    )

    const validatorDeployedAtBlock = await validatorContract.methods.deployedAtBlock().call()

    const validatorAddedEvents = await validatorContract.getPastEvents('ValidatorAdded', {
      fromBlock: validatorDeployedAtBlock,
      filter: { validator: process.env.VALIDATOR_ADDRESS }
    })

    return validatorAddedEvents.length ? validatorAddedEvents[0].blockNumber : deployedAtBlock
  } catch (e) {
    return 0
  }
}

async function main() {
  const { HOME_BRIDGE_ADDRESS, FOREIGN_BRIDGE_ADDRESS } = process.env

  const homeRpcUrl = rpcUrlsManager.homeUrls[0]
  const foreignRpcUrl = rpcUrlsManager.foreignUrls[0]
  const homeStartBlock = await getStartBlock(homeRpcUrl, HOME_BRIDGE_ADDRESS, homeABI)
  const foreignStartBlock = await getStartBlock(foreignRpcUrl, FOREIGN_BRIDGE_ADDRESS, foreignABI)
  const result = {
    homeStartBlock,
    foreignStartBlock
  }
  console.log(JSON.stringify(result))
  return result
}

main()

module.exports = main
