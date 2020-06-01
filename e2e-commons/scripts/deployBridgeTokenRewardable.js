const path = require('path')
const { user } = require('../constants.json')
const contractsPath = '../../contracts'
require('dotenv').config({
  path: path.join(__dirname, contractsPath, '/deploy/.env')
})

const { deployContract, sendRawTxHome, privateKeyToAddress } = require(`${contractsPath}/deploy/src/deploymentUtils`)
const { web3Home, deploymentPrivateKey } = require(`${contractsPath}/deploy/src/web3`)
const ERC677BridgeTokenRewardable = require(`${contractsPath}/build/contracts/ERC677BridgeTokenRewardable.json`)

const { DEPLOYMENT_ACCOUNT_PRIVATE_KEY } = process.env
const DEPLOYMENT_ACCOUNT_ADDRESS = privateKeyToAddress(DEPLOYMENT_ACCOUNT_PRIVATE_KEY)

async function deployBridgeTokenRewardable() {
  try {
    let homeNonce = await web3Home.eth.getTransactionCount(DEPLOYMENT_ACCOUNT_ADDRESS)
    console.log('\n[Home] Deploying ERC677BridgeTokenRewardable Test token')
    const stakeToken = await deployContract(ERC677BridgeTokenRewardable, ['STAKE', 'STAKE', '18', '77'], {
      from: DEPLOYMENT_ACCOUNT_ADDRESS,
      network: 'home',
      nonce: homeNonce
    })
    homeNonce++
    console.log('[Home] Stake Token: ', stakeToken.options.address)

    const mintData = await stakeToken.methods
      .mint(user.address, '500000000000000000000')
      .encodeABI({ from: DEPLOYMENT_ACCOUNT_ADDRESS })
    await sendRawTxHome({
      data: mintData,
      nonce: homeNonce,
      to: stakeToken.options.address,
      privateKey: deploymentPrivateKey,
      url: process.env.HOME_RPC_URL
    })
  } catch (e) {
    console.log(e)
    throw e
  }
}

deployBridgeTokenRewardable()
