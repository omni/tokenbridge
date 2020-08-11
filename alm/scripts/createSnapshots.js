  const { BRIDGE_VALIDATORS_ABI, HOME_AMB_ABI } = require('commons')

const path = require('path')
require('dotenv').config()
const Web3 = require('web3')

const fs = require('fs')

const {
  COMMON_HOME_RPC_URL,
  COMMON_HOME_BRIDGE_ADDRESS,
  COMMON_FOREIGN_RPC_URL,
  COMMON_FOREIGN_BRIDGE_ADDRESS
} = process.env

const generateSnapshot = async (side, url, bridgeAddress) => {
  const snapshotPath = `../src/snapshots/${side}.json`
  const snapshotFullPath = path.join(__dirname, snapshotPath)
  const snapshot = {}

  const web3 = new Web3(new Web3.providers.HttpProvider(url))

  const currentBlockNumber = await web3.eth.getBlockNumber()
  snapshot.snapshotBlockNumber = currentBlockNumber

  // Save chainId
  snapshot.chainId = await web3.eth.getChainId()

  const bridgeContract = new web3.eth.Contract(HOME_AMB_ABI, bridgeAddress)

  console.log('Getting the block to start looking for the bridge events for', side)

  let deployedAtBlock = await bridgeContract.methods.deployedAtBlock().call()

  console.log('Getting events to track changes of required block confirmations for', side)
  // Save RequiredBlockConfirmationChanged events
  let requiredBlockConfirmationChangedEvents = []
  requiredBlockConfirmationChangedEvents = await bridgeContract.getPastEvents('RequiredBlockConfirmationChanged', {
    fromBlock: deployedAtBlock,
    toBlock: currentBlockNumber
  }).catch(error => {
    console.log('Cannot get required block confirmations for', side)
  })

  // In case RequiredBlockConfirmationChanged was not emitted during initialization in early versions of AMB
  // manually generate an event for this. Example Sokol - Kovan bridge
  if (requiredBlockConfirmationChangedEvents.length === 0) {
    console.log('Getting required block confirmations from the contract storage for', side)
    const blockConfirmations = await bridgeContract.methods.requiredBlockConfirmations().call()

    requiredBlockConfirmationChangedEvents.push({
      blockNumber: parseInt(deployedAtBlock),
      returnValues: {
        requiredBlockConfirmations: blockConfirmations
      }
    })
  }

  snapshot.RequiredBlockConfirmationChanged = requiredBlockConfirmationChangedEvents.map(e => ({
    blockNumber: e.blockNumber,
    returnValues: {
      requiredBlockConfirmations: e.returnValues.requiredBlockConfirmations
    }
  }))

  const validatorAddress = await bridgeContract.methods.validatorContract().call()
  const validatorContract = new web3.eth.Contract(BRIDGE_VALIDATORS_ABI, validatorAddress)

  console.log('Getting the block to start looking for the validators events for', side)

  deployedAtBlock = await validatorContract.methods.deployedAtBlock().call()

  console.log('Getting events to track changes of required signatures for', side)
  // Save RequiredSignaturesChanged events
  const RequiredSignaturesChangedEvents = await validatorContract.getPastEvents('RequiredSignaturesChanged', {
    fromBlock: deployedAtBlock,
    toBlock: currentBlockNumber
  })
  snapshot.RequiredSignaturesChanged = RequiredSignaturesChangedEvents.map(e => ({
    blockNumber: e.blockNumber,
    returnValues: {
      requiredSignatures: e.returnValues.requiredSignatures
    }
  }))

  console.log('Getting events to track changes of validators added for', side)
  // Save ValidatorAdded events
  const validatorAddedEvents = await validatorContract.getPastEvents('ValidatorAdded', {
    fromBlock: deployedAtBlock,
    toBlock: currentBlockNumber
  })

  snapshot.ValidatorAdded = validatorAddedEvents.map(e => ({
    blockNumber: e.blockNumber,
    returnValues: {
      validator: e.returnValues.validator
    },
    event: 'ValidatorAdded'
  }))

  console.log('Getting events to track changes of validators removed for', side)
  // Save ValidatorRemoved events
  const validatorRemovedEvents = await validatorContract.getPastEvents('ValidatorRemoved', {
    fromBlock: deployedAtBlock,
    toBlock: currentBlockNumber
  })

  snapshot.ValidatorRemoved = validatorRemovedEvents.map(e => ({
    blockNumber: e.blockNumber,
    returnValues: {
      validator: e.returnValues.validator
    },
    event: 'ValidatorRemoved'
  }))

  // Write snapshot
  fs.writeFileSync(snapshotFullPath, JSON.stringify(snapshot, null, 2))
}

const main = async () => {
  await Promise.all([
    generateSnapshot('home', COMMON_HOME_RPC_URL, COMMON_HOME_BRIDGE_ADDRESS),
    generateSnapshot('foreign', COMMON_FOREIGN_RPC_URL, COMMON_FOREIGN_BRIDGE_ADDRESS)
  ])
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.log('Error while creating snapshots')
    console.error(error)
    process.exit(1)
  })
