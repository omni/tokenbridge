const path = require('path')
const { ambStakeErcToErc, validator, secondValidator, thirdValidator } = require('../constants.json')
const contractsPath = '../../contracts'
require('dotenv').config({
  path: path.join(__dirname, contractsPath, '/deploy/.env')
})
const { sendRawTxHome, sendRawTxForeign, privateKeyToAddress } = require(`${contractsPath}/deploy/src/deploymentUtils`)
const { web3Home, web3Foreign, deploymentPrivateKey } = require(`${contractsPath}/deploy/src/web3`)
const BlockReward = require(`${contractsPath}/build/contracts/BlockRewardMock.json`)
const ERC677BridgeTokenRewardable = require(`${contractsPath}/build/contracts/ERC677BridgeTokenRewardable.json`)
const ERC677MultiBridgeToken = require(`${contractsPath}/build/contracts/ERC677MultiBridgeToken.json`)

const { DEPLOYMENT_ACCOUNT_PRIVATE_KEY } = process.env
const DEPLOYMENT_ACCOUNT_ADDRESS = privateKeyToAddress(DEPLOYMENT_ACCOUNT_PRIVATE_KEY)

async function setupStakeTokens() {
  try {
    let homeNonce = await web3Home.eth.getTransactionCount(DEPLOYMENT_ACCOUNT_ADDRESS)

    const blockReward = new web3Home.eth.Contract(BlockReward.abi, ambStakeErcToErc.blockReward)

    console.log('\n[Home] Set token in block reward')
    const setTokenData = await blockReward.methods.setToken(ambStakeErcToErc.homeToken).encodeABI()
    await sendRawTxHome({
      data: setTokenData,
      nonce: homeNonce,
      to: blockReward.options.address,
      privateKey: deploymentPrivateKey,
      url: process.env.HOME_RPC_URL
    })
    homeNonce++

    console.log('\n[Home] Set validators rewards in block reward')
    const setValidatorsRewardsData = await blockReward.methods
      .setValidatorsRewards([validator.address, secondValidator.address, thirdValidator.address])
      .encodeABI()
    await sendRawTxHome({
      data: setValidatorsRewardsData,
      nonce: homeNonce,
      to: blockReward.options.address,
      privateKey: deploymentPrivateKey,
      url: process.env.HOME_RPC_URL
    })
    homeNonce++

    const homeToken = new web3Home.eth.Contract(ERC677BridgeTokenRewardable.abi, ambStakeErcToErc.homeToken)

    console.log('\n[Home] Set block reward in token')
    const setBlockRewardData = await homeToken.methods.setBlockRewardContract(ambStakeErcToErc.blockReward).encodeABI()
    await sendRawTxHome({
      data: setBlockRewardData,
      nonce: homeNonce,
      to: homeToken.options.address,
      privateKey: deploymentPrivateKey,
      url: process.env.HOME_RPC_URL
    })
    homeNonce++

    console.log('\n[Home] Add bridge in token')
    const addBridgeData = await homeToken.methods.addBridge(ambStakeErcToErc.home).encodeABI()
    await sendRawTxHome({
      data: addBridgeData,
      nonce: homeNonce,
      to: homeToken.options.address,
      privateKey: deploymentPrivateKey,
      url: process.env.HOME_RPC_URL
    })
    homeNonce++

    console.log('\n[Home] transfer token ownership to mediator')
    const transferOwnershipData = await homeToken.methods.transferOwnership(ambStakeErcToErc.home).encodeABI()
    await sendRawTxHome({
      data: transferOwnershipData,
      nonce: homeNonce,
      to: homeToken.options.address,
      privateKey: deploymentPrivateKey,
      url: process.env.HOME_RPC_URL
    })
    homeNonce++

    let foreignNonce = await web3Foreign.eth.getTransactionCount(DEPLOYMENT_ACCOUNT_ADDRESS)
    const foreignToken = new web3Foreign.eth.Contract(ERC677MultiBridgeToken.abi, ambStakeErcToErc.foreignToken)

    console.log('\n[Foreign] Add bridge in token')
    const addBridgeForeignData = await homeToken.methods.addBridge(ambStakeErcToErc.foreign).encodeABI()
    await sendRawTxForeign({
      data: addBridgeForeignData,
      nonce: foreignNonce,
      to: foreignToken.options.address,
      privateKey: deploymentPrivateKey,
      url: process.env.FOREIGN_RPC_URL
    })
    foreignNonce++

    console.log('\n[Foreign] transfer token ownership to mediator')
    const transferOwnershipForeignData = await homeToken.methods.transferOwnership(ambStakeErcToErc.foreign).encodeABI()
    await sendRawTxForeign({
      data: transferOwnershipForeignData,
      nonce: foreignNonce,
      to: foreignToken.options.address,
      privateKey: deploymentPrivateKey,
      url: process.env.FOREIGN_RPC_URL
    })
    foreignNonce++
  } catch (e) {
    console.log(e)
    throw e
  }
}

setupStakeTokens()
