/* eslint import/no-unresolved: 0  node/no-missing-require: 0 */
const path = require('path')
const { contractsPath, user } = require('../constants.json')
require('dotenv').config({
  path: path.join(__dirname, '..', contractsPath, '/deploy/.env')
})

const {
  deployContract,
  sendRawTxForeign,
  privateKeyToAddress
} = require(`../${contractsPath}/deploy/src/deploymentUtils`)
const {
  web3Foreign,
  deploymentPrivateKey
} = require(`../${contractsPath}/deploy/src/web3`)
const POA20 = require(`../${contractsPath}/build/contracts/ERC677BridgeToken.json`)

const { DEPLOYMENT_ACCOUNT_PRIVATE_KEY } = process.env
const DEPLOYMENT_ACCOUNT_ADDRESS = privateKeyToAddress(DEPLOYMENT_ACCOUNT_PRIVATE_KEY)

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
      .mint(user.address, '1000000000000000000')
      .encodeABI({ from: DEPLOYMENT_ACCOUNT_ADDRESS })
    await sendRawTxForeign({
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
