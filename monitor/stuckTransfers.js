require('dotenv').config()
const logger = require('./logger')('stuckTransfers.js')
const { FOREIGN_V1_ABI } = require('../commons/abis')
const { web3Foreign, getForeignBlockNumber } = require('./utils/web3')
const { getPastEvents } = require('./utils/web3Cache')

const { COMMON_FOREIGN_BRIDGE_ADDRESS } = process.env
const MONITOR_FOREIGN_START_BLOCK = Number(process.env.MONITOR_FOREIGN_START_BLOCK) || 0

const ABITransferWithoutData = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'from',
        type: 'address'
      },
      {
        indexed: true,
        name: 'to',
        type: 'address'
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256'
      }
    ],
    name: 'Transfer',
    type: 'event'
  }
]

const ABIWithData = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'from',
        type: 'address'
      },
      {
        indexed: true,
        name: 'to',
        type: 'address'
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256'
      },
      {
        indexed: false,
        name: 'data',
        type: 'bytes'
      }
    ],
    name: 'Transfer',
    type: 'event'
  }
]

function transferWithoutCallback(transfersNormal) {
  const txHashes = new Set()
  transfersNormal.forEach(transfer => txHashes.add(transfer.transactionHash))
  return withData => !txHashes.has(withData.transactionHash)
}

async function main() {
  const foreignBridge = new web3Foreign.eth.Contract(FOREIGN_V1_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
  logger.debug('calling foreignBridge.methods.erc677token')
  const erc20Address = await foreignBridge.methods.erc677token().call()
  const tokenContract = new web3Foreign.eth.Contract(ABITransferWithoutData, erc20Address)
  const tokenContractWithData = new web3Foreign.eth.Contract(ABIWithData, erc20Address)
  logger.debug('getting last block number')
  const foreignBlockNumber = await getForeignBlockNumber()
  const foreignConfirmations = await foreignBridge.methods.requiredBlockConfirmations().call()
  const foreignDelayedBlockNumber = foreignBlockNumber - foreignConfirmations
  logger.debug('calling tokenContract.getPastEvents Transfer')
  const options = {
    event: 'Transfer',
    options: {
      filter: {
        to: COMMON_FOREIGN_BRIDGE_ADDRESS
      }
    },
    fromBlock: MONITOR_FOREIGN_START_BLOCK,
    toBlock: foreignBlockNumber,
    chain: 'foreign',
    safeToBlock: foreignDelayedBlockNumber
  }
  const transfersNormal = await getPastEvents(tokenContract, options)
  logger.debug('calling tokenContractWithData.getPastEvents Transfer')
  const transfersWithData = await getPastEvents(tokenContractWithData, options)
  const stuckTransfers = transfersNormal.filter(transferWithoutCallback(transfersWithData))
  logger.debug('Done')
  return {
    stuckTransfers,
    total: stuckTransfers.length,
    lastChecked: Math.floor(Date.now() / 1000)
  }
}
module.exports = main
