require('../env')
const { privateKeyToAddress } = require('../src/utils/utils')
const { EXIT_CODES } = require('../src/utils/constants')

const privateKey = process.env.ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY

if (!privateKey) {
  console.error('Environment variable ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY is not set')
  process.exit(EXIT_CODES.GENERAL_ERROR)
}

const address = privateKeyToAddress(privateKey)

console.log(address)
