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
  const snapshot = require(snapshotPath)

  const web3 = new Web3(new Web3.providers.HttpProvider(url))

  const currentBlockNumber = await web3.eth.getBlockNumber()

  // Save chainId
  snapshot.chainId = await web3.eth.getChainId()

  const bridgeContract = new web3.eth.Contract(HOME_AMB_ABI, bridgeAddress)

  // Save RequiredBlockConfirmationChanged events
  let requiredBlockConfirmationChangedEvents = await bridgeContract.getPastEvents('RequiredBlockConfirmationChanged', {
    fromBlock: 0,
    toBlock: currentBlockNumber
  })

  // In case RequiredBlockConfirmationChanged was not emitted during initialization in early versions of AMB
  // manually generate an event for this. Example Sokol - Kovan bridge
  if (requiredBlockConfirmationChangedEvents.length === 0) {
    const deployedAtBlock = await bridgeContract.methods.deployedAtBlock().call()
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

  // Save validatorAddress
  const validatorAddress = await bridgeContract.methods.validatorContract().call()
  snapshot.validatorAddress = validatorAddress

  const validatorContract = new web3.eth.Contract(BRIDGE_VALIDATORS_ABI, validatorAddress)

  // Save RequiredSignaturesChanged events
  const RequiredSignaturesChangedEvents = await validatorContract.getPastEvents('RequiredSignaturesChanged', {
    fromBlock: 0,
    toBlock: currentBlockNumber
  })
  snapshot.RequiredSignaturesChanged = RequiredSignaturesChangedEvents.map(e => ({
    blockNumber: e.blockNumber,
    returnValues: {
      requiredSignatures: e.returnValues.requiredSignatures
    }
  }))

  // Save ValidatorAdded events
  const validatorAddedEvents = await validatorContract.getPastEvents('ValidatorAdded', {
    fromBlock: 0,
    toBlock: currentBlockNumber
  })

  snapshot.ValidatorAdded = validatorAddedEvents.map(e => ({
    blockNumber: e.blockNumber,
    returnValues: {
      validator: e.returnValues.validator
    }
  }))

  // Save ValidatorRemoved events
  const validatorRemovedEvents = await validatorContract.getPastEvents('ValidatorRemoved', {
    fromBlock: 0,
    toBlock: currentBlockNumber
  })

  snapshot.ValidatorRemoved = validatorRemovedEvents.map(e => ({
    blockNumber: e.blockNumber,
    returnValues: {
      validator: e.returnValues.validator
    }
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
    console.error(error)
    process.exit(1)
  })
