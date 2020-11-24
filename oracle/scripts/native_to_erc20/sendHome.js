require('../../env')
const { web3Home } = require('../../src/services/web3')
const { sendTx } = require('../../src/tx/sendTx')
const { isValidAmount } = require('../utils/utils')
const { HOME_NATIVE_TO_ERC_ABI } = require('../../../commons')

const {
  USER_ADDRESS,
  USER_ADDRESS_PRIVATE_KEY,
  COMMON_HOME_BRIDGE_ADDRESS,
  HOME_MIN_AMOUNT_PER_TX,
  HOME_TEST_TX_GAS_PRICE
} = process.env

const NUMBER_OF_DEPOSITS_TO_SEND = process.argv[2] || 1

async function main() {
  const bridge = new web3Home.eth.Contract(HOME_NATIVE_TO_ERC_ABI, COMMON_HOME_BRIDGE_ADDRESS)

  try {
    await isValidAmount(HOME_MIN_AMOUNT_PER_TX, bridge)

    const homeChainId = await web3Home.eth.getChainId()
    let nonce = await web3Home.eth.getTransactionCount(USER_ADDRESS)
    let actualSent = 0
    for (let i = 0; i < Number(NUMBER_OF_DEPOSITS_TO_SEND); i++) {
      const txHash = await sendTx({
        privateKey: USER_ADDRESS_PRIVATE_KEY,
        data: '0x',
        nonce,
        gasPrice: HOME_TEST_TX_GAS_PRICE,
        amount: HOME_MIN_AMOUNT_PER_TX,
        gasLimit: 100000,
        to: COMMON_HOME_BRIDGE_ADDRESS,
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
