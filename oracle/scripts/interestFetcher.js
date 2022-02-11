require('../env')
const { isAddress } = require('web3').utils
const { privateKeyToAddress, setIntervalAndRun } = require('../src/utils/utils')
const { EXIT_CODES } = require('../src/utils/constants')
const { web3Home } = require('../src/services/web3')
const { sendTx } = require('../src/tx/sendTx')

const privateKey = process.env.INTEREST_FETCHER_PRIVATE_KEY
const interval = process.env.INTERVAL ? parseInt(process.env.INTERVAL, 10) : 3600 * 1000
const contractAddress = process.env.INTEREST_FETCH_CONTRACT_ADDRESS

if (!privateKey) {
  console.error('Environment variable INTEREST_FETCHER_PRIVATE_KEY is not set')
  process.exit(EXIT_CODES.GENERAL_ERROR)
}

if (interval < 300 * 1000) {
  console.error('Interval is to small, should be at least 5 minutes')
  process.exit(EXIT_CODES.GENERAL_ERROR)
}

if (!isAddress(contractAddress)) {
  console.error('Invalid contract address provided', contractAddress)
  process.exit(EXIT_CODES.GENERAL_ERROR)
}

const gasPrice = process.env.COMMON_HOME_GAS_PRICE_FALLBACK || '1000000000'

async function main() {
  // assuming that we are using this contract - https://github.com/omni/interest-fetcher-contract
  const contract = new web3Home.eth.Contract([{ name: 'fetchInterest', type: 'function', inputs: [] }], contractAddress)
  const chainId = await web3Home.eth.getChainId()
  const data = contract.methods.fetchInterest().encodeABI()
  const senderAddress = privateKeyToAddress(privateKey)
  console.log(
    `Initialized, chainId=${chainId}, data=${data}, contract=${contractAddress}, interval=${interval / 1000}s`
  )

  await setIntervalAndRun(async () => {
    let gasLimit
    try {
      gasLimit = await contract.methods.fetchInterest().estimateGas()
    } catch (e) {
      console.log('Gas limit estimation failed, will retry later', new Date())
      return
    }

    const nonce = await web3Home.eth.getTransactionCount(senderAddress)

    const txHash = await sendTx({
      privateKey,
      to: contractAddress,
      data,
      nonce,
      gasPrice,
      gasLimit: Math.round(gasLimit * 1.5),
      value: '0',
      chainId,
      web3: web3Home
    })
    console.log('Sent transaction with fetch interest', txHash, new Date())
  }, interval)
}

main()
