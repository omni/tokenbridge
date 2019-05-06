const path = require('path')
require('dotenv').config({
  path: path.join(__dirname, '../../.env')
})
const Web3Utils = require('web3-utils')
const { web3Foreign } = require('../../src/services/web3')
const { sendTx, sendRawTx } = require('../../src/tx/sendTx')
const { isValidAmount } = require('../utils/utils')

const {
  USER_ADDRESS,
  USER_ADDRESS_PRIVATE_KEY,
  FOREIGN_BRIDGE_ADDRESS,
  FOREIGN_MIN_AMOUNT_PER_TX,
  FOREIGN_TEST_TX_GAS_PRICE
} = process.env

const NUMBER_OF_WITHDRAWALS_TO_SEND =
  process.argv[2] || process.env.NUMBER_OF_WITHDRAWALS_TO_SEND || 1

const ERC677_ABI = [
  {
    constant: false,
    inputs: [
      {
        name: '',
        type: 'address'
      },
      {
        name: '',
        type: 'uint256'
      },
      {
        name: '',
        type: 'bytes'
      }
    ],
    name: 'transferAndCall',
    outputs: [
      {
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  }
]
const BRIDGE_ABI = require('../../abis/ForeignBridgeNativeToErc.abi')

async function main() {
  const bridge = new web3Foreign.eth.Contract(BRIDGE_ABI, FOREIGN_BRIDGE_ADDRESS)
  const ERC20_TOKEN_ADDRESS = await bridge.methods.erc677token().call()
  const poa20 = new web3Foreign.eth.Contract(ERC677_ABI, ERC20_TOKEN_ADDRESS)

  try {
    await isValidAmount(FOREIGN_MIN_AMOUNT_PER_TX, bridge)

    const foreignChaindId = await sendRawTx({
      chain: 'foreign',
      params: [],
      method: 'net_version'
    })
    let nonce = await sendRawTx({
      chain: 'foreign',
      method: 'eth_getTransactionCount',
      params: [USER_ADDRESS, 'latest']
    })
    nonce = Web3Utils.hexToNumber(nonce)
    let actualSent = 0
    for (let i = 0; i < Number(NUMBER_OF_WITHDRAWALS_TO_SEND); i++) {
      const gasLimit = await poa20.methods
        .transferAndCall(FOREIGN_BRIDGE_ADDRESS, Web3Utils.toWei(FOREIGN_MIN_AMOUNT_PER_TX), '0x')
        .estimateGas({ from: USER_ADDRESS })
      const data = await poa20.methods
        .transferAndCall(FOREIGN_BRIDGE_ADDRESS, Web3Utils.toWei(FOREIGN_MIN_AMOUNT_PER_TX), '0x')
        .encodeABI({ from: USER_ADDRESS })
      const txHash = await sendTx({
        chain: 'foreign',
        privateKey: USER_ADDRESS_PRIVATE_KEY,
        data,
        nonce,
        gasPrice: FOREIGN_TEST_TX_GAS_PRICE,
        amount: '0',
        gasLimit,
        to: ERC20_TOKEN_ADDRESS,
        web3: web3Foreign,
        chainId: foreignChaindId
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
