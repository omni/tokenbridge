require('../../env')
const { toWei } = require('web3').utils
const { web3Home } = require('../../src/services/web3')
const { sendTx } = require('../../src/tx/sendTx')
const { isValidAmount } = require('../utils/utils')
const { HOME_ERC_TO_ERC_ABI } = require('../../../commons')

const {
  USER_ADDRESS,
  USER_ADDRESS_PRIVATE_KEY,
  COMMON_HOME_BRIDGE_ADDRESS,
  HOME_MIN_AMOUNT_PER_TX,
  HOME_TEST_TX_GAS_PRICE
} = process.env

const NUMBER_OF_WITHDRAWALS_TO_SEND = process.argv[2] || process.env.NUMBER_OF_WITHDRAWALS_TO_SEND || 1

const BRIDGEABLE_TOKEN_ABI = [
  {
    constant: false,
    inputs: [
      {
        name: '_to',
        type: 'address'
      },
      {
        name: '_value',
        type: 'uint256'
      },
      {
        name: '_data',
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

async function main() {
  const bridge = new web3Home.eth.Contract(HOME_ERC_TO_ERC_ABI, COMMON_HOME_BRIDGE_ADDRESS)
  const BRIDGEABLE_TOKEN_ADDRESS = await bridge.methods.erc677token().call()
  const erc677 = new web3Home.eth.Contract(BRIDGEABLE_TOKEN_ABI, BRIDGEABLE_TOKEN_ADDRESS)

  try {
    await isValidAmount(HOME_MIN_AMOUNT_PER_TX, bridge)

    const homeChainId = await web3Home.eth.getChainId()
    let nonce = await web3Home.eth.getTransactionCount(USER_ADDRESS)
    let actualSent = 0
    for (let i = 0; i < Number(NUMBER_OF_WITHDRAWALS_TO_SEND); i++) {
      const gasLimit = await erc677.methods
        .transferAndCall(COMMON_HOME_BRIDGE_ADDRESS, toWei(HOME_MIN_AMOUNT_PER_TX), '0x')
        .estimateGas({ from: USER_ADDRESS })
      const data = await erc677.methods
        .transferAndCall(COMMON_HOME_BRIDGE_ADDRESS, toWei(HOME_MIN_AMOUNT_PER_TX), '0x')
        .encodeABI({ from: USER_ADDRESS })
      const txHash = await sendTx({
        privateKey: USER_ADDRESS_PRIVATE_KEY,
        data,
        nonce,
        gasPrice: HOME_TEST_TX_GAS_PRICE,
        amount: '0',
        gasLimit,
        to: BRIDGEABLE_TOKEN_ADDRESS,
        web3: web3Home,
        chainId: homeChainId
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
