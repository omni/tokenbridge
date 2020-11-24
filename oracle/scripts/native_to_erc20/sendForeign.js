require('../../env')
const { toWei } = require('web3').utils
const { web3Foreign } = require('../../src/services/web3')
const { sendTx } = require('../../src/tx/sendTx')
const { isValidAmount } = require('../utils/utils')
const { FOREIGN_NATIVE_TO_ERC_ABI } = require('../../../commons')

const {
  USER_ADDRESS,
  USER_ADDRESS_PRIVATE_KEY,
  COMMON_FOREIGN_BRIDGE_ADDRESS,
  FOREIGN_MIN_AMOUNT_PER_TX,
  FOREIGN_TEST_TX_GAS_PRICE
} = process.env

const NUMBER_OF_WITHDRAWALS_TO_SEND = process.argv[2] || process.env.NUMBER_OF_WITHDRAWALS_TO_SEND || 1

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

async function main() {
  const bridge = new web3Foreign.eth.Contract(FOREIGN_NATIVE_TO_ERC_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
  const bridgeableTokenAddress = await bridge.methods.erc677token().call()
  const poa20 = new web3Foreign.eth.Contract(ERC677_ABI, bridgeableTokenAddress)

  try {
    await isValidAmount(FOREIGN_MIN_AMOUNT_PER_TX, bridge)

    const foreignChainId = await web3Foreign.eth.getChainId()
    let nonce = await web3Foreign.eth.getTransactionCount(USER_ADDRESS)
    let actualSent = 0
    for (let i = 0; i < Number(NUMBER_OF_WITHDRAWALS_TO_SEND); i++) {
      const gasLimit = await poa20.methods
        .transferAndCall(COMMON_FOREIGN_BRIDGE_ADDRESS, toWei(FOREIGN_MIN_AMOUNT_PER_TX), '0x')
        .estimateGas({ from: USER_ADDRESS })
      const data = await poa20.methods
        .transferAndCall(COMMON_FOREIGN_BRIDGE_ADDRESS, toWei(FOREIGN_MIN_AMOUNT_PER_TX), '0x')
        .encodeABI({ from: USER_ADDRESS })
      const txHash = await sendTx({
        privateKey: USER_ADDRESS_PRIVATE_KEY,
        data,
        nonce,
        gasPrice: FOREIGN_TEST_TX_GAS_PRICE,
        amount: '0',
        gasLimit,
        to: bridgeableTokenAddress,
        web3: web3Foreign,
        chainId: foreignChainId
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
