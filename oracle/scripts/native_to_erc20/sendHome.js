const path = require('path')
require('dotenv').config({
  path: path.join(__dirname, '../../.env')
})
const Web3Utils = require('web3-utils')
const { web3Home } = require('../../src/services/web3')
const { sendTx, sendRawTx } = require('../../src/tx/sendTx')
const { isValidAmount } = require('../utils/utils')
const BRIDGE_ABI = require('../../abis/HomeBridgeNativeToErc.abi')

const {
  USER_ADDRESS,
  USER_ADDRESS_PRIVATE_KEY,
  HOME_BRIDGE_ADDRESS,
  HOME_MIN_AMOUNT_PER_TX,
  HOME_TEST_TX_GAS_PRICE
} = process.env

const NUMBER_OF_DEPOSITS_TO_SEND = process.argv[2] || 1

async function main() {
  const bridge = new web3Home.eth.Contract(BRIDGE_ABI, HOME_BRIDGE_ADDRESS)

  try {
    await isValidAmount(HOME_MIN_AMOUNT_PER_TX, bridge)

    const homeChaindId = await sendRawTx({
      chain: 'home',
      params: [],
      method: 'net_version'
    })
    let nonce = await sendRawTx({
      chain: 'home',
      method: 'eth_getTransactionCount',
      params: [USER_ADDRESS, 'latest']
    })
    nonce = Web3Utils.hexToNumber(nonce)
    let actualSent = 0
    for (let i = 0; i < Number(NUMBER_OF_DEPOSITS_TO_SEND); i++) {
      const txHash = await sendTx({
        chain: 'home',
        privateKey: USER_ADDRESS_PRIVATE_KEY,
        data: '0x',
        nonce,
        gasPrice: HOME_TEST_TX_GAS_PRICE,
        amount: HOME_MIN_AMOUNT_PER_TX,
        gasLimit: 100000,
        to: HOME_BRIDGE_ADDRESS,
        web3: web3Home,
        chainId: homeChaindId
      })
      if (txHash !== undefined) {
        nonce++
        actualSent++
        console.log(actualSent, ' # ', txHash)
      }
    }
  } catch (e) {
    console.log(e)
  }
}
main()
