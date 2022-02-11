const baseConfig = require('./base.config')
const { MEV_HELPER_ABI } = require('../src/utils/mev')

const {
  ORACLE_MEV_FOREIGN_HELPER_CONTRACT_ADDRESS,
  ORACLE_MEV_FOREIGN_MIN_GAS_PRICE,
  ORACLE_MEV_FOREIGN_FLAT_MINER_FEE,
  ORACLE_MEV_FOREIGN_MAX_PRIORITY_FEE_PER_GAS,
  ORACLE_MEV_FOREIGN_MAX_FEE_PER_GAS
} = process.env

const id = `${baseConfig.id}-collected-signatures-mev`

const contract = new baseConfig.foreign.web3.eth.Contract(MEV_HELPER_ABI, ORACLE_MEV_FOREIGN_HELPER_CONTRACT_ADDRESS)

module.exports = {
  ...baseConfig,
  mevForeign: {
    contractAddress: ORACLE_MEV_FOREIGN_HELPER_CONTRACT_ADDRESS,
    contract,
    minGasPrice: ORACLE_MEV_FOREIGN_MIN_GAS_PRICE,
    flatMinerFee: ORACLE_MEV_FOREIGN_FLAT_MINER_FEE,
    maxPriorityFeePerGas: ORACLE_MEV_FOREIGN_MAX_PRIORITY_FEE_PER_GAS,
    maxFeePerGas: ORACLE_MEV_FOREIGN_MAX_FEE_PER_GAS
  },
  main: baseConfig.home,
  event: 'CollectedSignatures',
  name: `watcher-${id}`,
  id
}
