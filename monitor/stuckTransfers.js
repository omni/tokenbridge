require('dotenv').config()
const Web3 = require('web3')
const logger = require('./logger')('stuckTransfers.js')
const { foreignViAbi } = require('./utils/v1Abis')

const { FOREIGN_RPC_URL, FOREIGN_BRIDGE_ADDRESS } = process.env
const FOREIGN_DEPLOYMENT_BLOCK = Number(process.env.FOREIGN_DEPLOYMENT_BLOCK) || 0

const foreignProvider = new Web3.providers.HttpProvider(FOREIGN_RPC_URL)
const web3Foreign = new Web3(foreignProvider)

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

function compareTransfers(transfersNormal) {
  return withData => {
    return (
      transfersNormal.filter(normal => {
        return normal.transactionHash === withData.transactionHash
      }).length === 0
    )
  }
}

async function main() {
  const foreignBridge = new web3Foreign.eth.Contract(foreignViAbi, FOREIGN_BRIDGE_ADDRESS)
  const erc20Address = await foreignBridge.methods.erc677token().call()
  const tokenContract = new web3Foreign.eth.Contract(ABITransferWithoutData, erc20Address)
  const tokenContractWithData = new web3Foreign.eth.Contract(ABIWithData, erc20Address)
  logger.debug('calling tokenContract.getPastEvents Transfer')
  const transfersNormal = await tokenContract.getPastEvents('Transfer', {
    filter: {
      to: FOREIGN_BRIDGE_ADDRESS
    },
    fromBlock: FOREIGN_DEPLOYMENT_BLOCK,
    toBlock: 'latest'
  })
  logger.debug('calling tokenContractWithData.getPastEvents Transfer')
  const transfersWithData = await tokenContractWithData.getPastEvents('Transfer', {
    filter: {
      to: FOREIGN_BRIDGE_ADDRESS
    },
    fromBlock: FOREIGN_DEPLOYMENT_BLOCK,
    toBlock: 'latest'
  })
  const stuckTransfers = transfersNormal.filter(compareTransfers(transfersWithData))
  logger.debug('Done')
  return {
    stuckTransfers,
    total: stuckTransfers.length,
    lastChecked: Math.floor(Date.now() / 1000)
  }
}
module.exports = main
