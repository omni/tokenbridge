import { Contract } from 'web3-eth-contract'

export const getRequiredBlockConfirmations = async (contract: Contract) => {
  const blockConfirmations = await contract.methods.requiredBlockConfirmations().call()
  return parseInt(blockConfirmations)
}

export const getValidatorAddress = (contract: Contract) => contract.methods.validatorContract().call()

export const getRequiredSignatures = async (contract: Contract, blockNumber: number) => {
  const events = await contract.getPastEvents('RequiredSignaturesChanged', {
    fromBlock: 0,
    toBlock: blockNumber
  })

  // Use the value form last event before the transaction
  const event = events[events.length - 1]
  const { requiredSignatures } = event.returnValues
  return parseInt(requiredSignatures)
}

export const getValidatorList = async (contract: Contract, blockNumber: number) => {
  let currentList: string[] = await contract.methods.validatorList().call()
  const [added, removed] = await Promise.all([
    contract.getPastEvents('ValidatorAdded', {
      fromBlock: blockNumber
    }),
    contract.getPastEvents('ValidatorRemoved', {
      fromBlock: blockNumber
    })
  ])

  // Ordered desc
  const orderedEvents = [...added, ...removed].sort(({ blockNumber: prev }, { blockNumber: next }) => next - prev)

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
