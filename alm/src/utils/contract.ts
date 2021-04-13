import { Contract } from 'web3-eth-contract'
import { EventData } from 'web3-eth-contract'
import { SnapshotProvider } from '../services/SnapshotProvider'
import { getLogs } from './explorer'
import Web3 from 'web3'

const getPastEventsWithFallback = (
  api: string,
  web3: Web3 | null,
  contract: Contract,
  eventName: string,
  options: any
) =>
  contract
    .getPastEvents(eventName, options)
    .catch(() => (api && web3 ? getLogs(api, web3, contract, eventName, options) : []))

export const getRequiredBlockConfirmations = async (
  contract: Contract,
  blockNumber: number,
  snapshotProvider: SnapshotProvider,
  web3: Web3 | null = null,
  api: string = ''
) => {
  const eventsFromSnapshot = snapshotProvider.requiredBlockConfirmationEvents(blockNumber)
  const snapshotBlockNumber = snapshotProvider.snapshotBlockNumber()

  let contractEvents: EventData[] = []
  if (blockNumber > snapshotBlockNumber) {
    contractEvents = await getPastEventsWithFallback(api, web3, contract, 'RequiredBlockConfirmationChanged', {
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
  snapshotProvider: SnapshotProvider,
  web3: Web3 | null = null,
  api: string = ''
) => {
  const eventsFromSnapshot = snapshotProvider.requiredSignaturesEvents(blockNumber)
  const snapshotBlockNumber = snapshotProvider.snapshotBlockNumber()

  let contractEvents: EventData[] = []
  if (blockNumber > snapshotBlockNumber) {
    contractEvents = await getPastEventsWithFallback(api, web3, contract, 'RequiredSignaturesChanged', {
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

export const getValidatorList = async (
  contract: Contract,
  blockNumber: number,
  snapshotProvider: SnapshotProvider,
  web3: Web3 | null = null,
  api: string = ''
) => {
  const addedEventsFromSnapshot = snapshotProvider.validatorAddedEvents(blockNumber)
  const removedEventsFromSnapshot = snapshotProvider.validatorRemovedEvents(blockNumber)
  const snapshotBlockNumber = snapshotProvider.snapshotBlockNumber()

  const fromBlock = snapshotBlockNumber > blockNumber ? snapshotBlockNumber + 1 : blockNumber
  const [currentList, added, removed] = await Promise.all([
    contract.methods.validatorList().call(),
    getPastEventsWithFallback(api, web3, contract, 'ValidatorAdded', {
      fromBlock
    }),
    getPastEventsWithFallback(api, web3, contract, 'ValidatorRemoved', {
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
