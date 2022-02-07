const baseConfig = require('./base.config')

const { DEFAULT_TRANSACTION_RESEND_INTERVAL } = require('../src/utils/constants')
const { MEV_HELPER_ABI } = require('../src/utils/mev')
const { web3Foreign, getFlashbotsProvider } = require('../src/services/web3')

const {
  ORACLE_FOREIGN_TX_RESEND_INTERVAL,
  ORACLE_MEV_FOREIGN_HELPER_CONTRACT_ADDRESS,
  ORACLE_MEV_FOREIGN_MIN_GAS_PRICE,
  ORACLE_MEV_FOREIGN_FLAT_MINER_FEE,
  ORACLE_MEV_FOREIGN_MAX_PRIORITY_FEE_PER_GAS,
  ORACLE_MEV_FOREIGN_MAX_FEE_PER_GAS,
  ORACLE_MEV_FOREIGN_BUNDLES_BLOCK_RANGE
} = process.env

const contract = new baseConfig.foreign.web3.eth.Contract(MEV_HELPER_ABI, ORACLE_MEV_FOREIGN_HELPER_CONTRACT_ADDRESS)

module.exports = {
  ...baseConfig,
  pollingInterval: baseConfig.foreign.pollingInterval,
  mevForeign: {
    contractAddress: ORACLE_MEV_FOREIGN_HELPER_CONTRACT_ADDRESS,
    contract,
    minGasPrice: ORACLE_MEV_FOREIGN_MIN_GAS_PRICE,
    flatMinerFee: ORACLE_MEV_FOREIGN_FLAT_MINER_FEE,
    maxPriorityFeePerGas: ORACLE_MEV_FOREIGN_MAX_PRIORITY_FEE_PER_GAS,
    maxFeePerGas: ORACLE_MEV_FOREIGN_MAX_FEE_PER_GAS,
    bundlesPerIteration: Math.max(parseInt(ORACLE_MEV_FOREIGN_BUNDLES_BLOCK_RANGE, 10) || 5, 1),
    getFlashbotsProvider
  },
  mevJobsRedisKey: `${baseConfig.id}-collected-signatures-mev:mevJobs`,
  id: 'mev-sender-foreign',
  name: 'mev-sender-foreign',
  web3: web3Foreign,
  resendInterval: parseInt(ORACLE_FOREIGN_TX_RESEND_INTERVAL, 10) || DEFAULT_TRANSACTION_RESEND_INTERVAL
}
