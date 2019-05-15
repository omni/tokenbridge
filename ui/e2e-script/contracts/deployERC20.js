/* eslint import/no-unresolved: 0  node/no-missing-require: 0 */
const path = require('path')
require('dotenv').config();
const {
  deployContract,
  sendRawTx
} = require('./src/deploymentUtils')
const {
  web3Foreign,
  deploymentPrivateKey
} = require('./src/web3')
const POA20 = require('../build/contracts/ERC677BridgeToken.json')
const user = '0x7FC1442AB55Da569940Eb750AaD2BAA63DA4010E'

const { DEPLOYMENT_ACCOUNT_ADDRESS } = process.env

async function deployErc20() {
  try {
    let foreignNonce = await web3Foreign.eth.getTransactionCount(DEPLOYMENT_ACCOUNT_ADDRESS)
    console.log('\n[Foreign] Deploying POA20 Test token')
    const poa20foreign = await deployContract(POA20, ['POA ERC20 Test', 'POA20', 18], {
      from: DEPLOYMENT_ACCOUNT_ADDRESS,
      network: 'foreign',
      nonce: foreignNonce
    })
    foreignNonce++
    console.log('[Foreign] POA20 Test: ', poa20foreign.options.address)

    const mintData = await poa20foreign.methods
      .mint(user, '500000000000000000000')
      .encodeABI({ from: DEPLOYMENT_ACCOUNT_ADDRESS })
    await sendRawTx({
      data: mintData,
      nonce: foreignNonce,
      to: poa20foreign.options.address,
      privateKey: deploymentPrivateKey,
      url: process.env.FOREIGN_RPC_URL
    })
  } catch (e) {
    console.log(e)
  }
}

deployErc20()
