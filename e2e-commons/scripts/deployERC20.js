/* eslint import/no-unresolved: 0  node/no-missing-require: 0 */
const path = require('path')
const contractsPath = '../../contracts';
require('dotenv').config({
  path: path.join(__dirname, contractsPath, '/deploy/.env')
})
const oracle_e2e_user = '0xbb140FbA6242a1c3887A7823F7750a73101383e3'
const ui_e2e_user = '0x7FC1442AB55Da569940Eb750AaD2BAA63DA4010E'

const {
  deployContract,
  sendRawTxForeign,
  privateKeyToAddress
} = require(`${contractsPath}/deploy/src/deploymentUtils`)
const {
  web3Foreign,
  deploymentPrivateKey
} = require(`${contractsPath}/deploy/src/web3`)
const POA20 = require(`${contractsPath}/build/contracts/ERC677BridgeToken.json`)

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

    const getMintData = (user) => poa20foreign.methods.mint(user, '1000000000000000000').encodeABI({ from: DEPLOYMENT_ACCOUNT_ADDRESS })

    await sendRawTxForeign({
      data: getMintData(oracle_e2e_user),
      nonce: foreignNonce,
      to: poa20foreign.options.address,
      privateKey: deploymentPrivateKey,
      url: process.env.FOREIGN_RPC_URL
    })

    foreignNonce++

    const receipt = await sendRawTxForeign({
      data: getMintData(ui_e2e_user),
      nonce: foreignNonce,
      to: poa20foreign.options.address,
      privateKey: deploymentPrivateKey,
      url: process.env.FOREIGN_RPC_URL
    })

    

  

  



  

  console.log('receipt is')
  console.log(receipt)

  // while(true) {
  //   const tx = await web3Foreign.eth.getTransaction(receipt.transactionHash);
  //   console.log('tx is: ')
  //   console.log(tx);
  //   await new Promise(resolve => setTimeout(resolve, 1000));
  // }

  } catch (e) {
    console.log(e)
  }
}

deployErc20()
