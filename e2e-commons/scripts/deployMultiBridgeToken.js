const path = require('path')
const { user } = require('../constants.json')
const contractsPath = '../../contracts'
require('dotenv').config({
  path: path.join(__dirname, contractsPath, '/deploy/.env')
})

const { deployContract, sendRawTxForeign, privateKeyToAddress } = require(`${contractsPath}/deploy/src/deploymentUtils`)
const { web3Foreign, deploymentPrivateKey } = require(`${contractsPath}/deploy/src/web3`)
const ERC677MultiBridgeToken = require(`${contractsPath}/build/contracts/ERC677MultiBridgeToken.json`)

const { DEPLOYMENT_ACCOUNT_PRIVATE_KEY } = process.env
const DEPLOYMENT_ACCOUNT_ADDRESS = privateKeyToAddress(DEPLOYMENT_ACCOUNT_PRIVATE_KEY)

async function deployMultiBridgeToken() {
  try {
    let foreignNonce = await web3Foreign.eth.getTransactionCount(DEPLOYMENT_ACCOUNT_ADDRESS)
    console.log('\n[Foreign] Deploying ERC677MultiBridgeToken Test token')
    const stakeToken = await deployContract(ERC677MultiBridgeToken, ['STAKE', 'STAKE', '18', '42'], {
      from: DEPLOYMENT_ACCOUNT_ADDRESS,
      network: 'foreign',
      nonce: foreignNonce
    })
    foreignNonce++
    console.log('[Foreign] Stake Token: ', stakeToken.options.address)

    const mintData = await stakeToken.methods
      .mint(user.address, '500000000000000000000')
      .encodeABI({ from: DEPLOYMENT_ACCOUNT_ADDRESS })
    await sendRawTxForeign({
      data: mintData,
      nonce: foreignNonce,
      to: stakeToken.options.address,
      privateKey: deploymentPrivateKey,
      url: process.env.FOREIGN_RPC_URL
    })
  } catch (e) {
    console.log(e)
    throw e
  }
}

deployMultiBridgeToken()
