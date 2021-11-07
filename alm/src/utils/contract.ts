import { Contract } from 'web3-eth-contract'
import { EventData } from 'web3-eth-contract'
import { SnapshotProvider } from '../services/SnapshotProvider'

export const getRequiredBlockConfirmations = async (
  contract: Contract,
  blockNumber: number,
  snapshotProvider: SnapshotProvider
) => {
  const eventsFromSnapshot = snapshotProvider.requiredBlockConfirmationEvents(blockNumber)
  const snapshotBlockNumber = snapshotProvider.snapshotBlockNumber()

  let contractEvents: EventData[] = []
  if (blockNumber > snapshotBlockNumber) {
    contractEvents = await contract.getPastEvents('RequiredBlockConfirmationChanged', {
      fromBlock: snapshotBlockNumber + 1,
      toBlock: blockNumber
    })
  }

  const events = [...eventsFromSnapshot, ...contractEvents]

  let blockConfirmations
  if (events.length > 0) {
    // Use the value from last event before the transaction
    const event = events[events.length - 1]
    blockConfirmations = event.returnValues.requiredBlockConfirmations
  } else {
    // This is a special case where RequiredBlockConfirmationChanged was not emitted during initialization in early versions of AMB
    // of Sokol - Kovan. In this case the current value is used.
    blockConfirmations = await contract.methods.requiredBlockConfirmations().call()
  }
  return parseInt(blockConfirmations)
}

export const getValidatorAddress = (contract: Contract) => contract.methods.validatorContract().call()

export const getRequiredSignatures = async (
  contract: Contract,
  blockNumber: number,
  snapshotProvider: SnapshotProvider
) => {
  const eventsFromSnapshot = snapshotProvider.requiredSignaturesEvents(blockNumber)
  const snapshotBlockNumber = snapshotProvider.snapshotBlockNumber()

  let contractEvents: EventData[] = []
  if (blockNumber > snapshotBlockNumber) {
    contractEvents = await contract.getPastEvents('RequiredSignaturesChanged', {
      fromBlock: snapshotBlockNumber + 1,
      toBlock: blockNumber
    })
  }

  const events = [...eventsFromSnapshot, ...contractEvents]

  // Use the value form last event before the transaction
  const event = events[events.length - 1]
  const { requiredSignatures } = event.returnValues
  return parseInt(requiredSignatures)
}

export const getValidatorList = async (contract: Contract, blockNumber: number, snapshotProvider: SnapshotProvider) => {
  const addedEventsFromSnapshot = snapshotProvider.validatorAddedEvents(blockNumber)
  const removedEventsFromSnapshot = snapshotProvider.validatorRemovedEvents(blockNumber)
  const snapshotBlockNumber = snapshotProvider.snapshotBlockNumber()

  const fromBlock = snapshotBlockNumber > blockNumber ? snapshotBlockNumber + 1 : blockNumber
  const [currentList, added, removed] = await Promise.all([
    contract.methods.validatorList().call(),
    contract.getPastEvents('ValidatorAdded', {
      fromBlock
    }),
    contract.getPastEvents('ValidatorRemoved', {
      fromBlock
    })
  ])

  // Ordered desc
  const orderedEvents = [...addedEventsFromSnapshot, ...added, ...removedEventsFromSnapshot, ...removed].sort(
    ({ blockNumber: prev }, { blockNumber: next }) => next - prev
  )

  // Stored as a Set to avoid duplicates
  const validatorList = new Set(currentList)

  orderedEvents.forEach(e => {
    const { validator } = e.returnValues
    if (e.event === 'ValidatorRemoved') {
      validatorList.add(validator)
    } else if (e.event === 'ValidatorAdded') {
      validatorList.delete(validator)
    }
  })

  return Array.from(validatorList)
}

export const getMessagesSigned = (contract: Contract, hash: string) => contract.methods.messagesSigned(hash).call()

export const getAffirmationsSigned = (contract: Contract, hash: string) =>
  contract.methods.affirmationsSigned(hash).call()
