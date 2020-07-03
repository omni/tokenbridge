import 'jest'
import { getRequiredBlockConfirmations, getRequiredSignatures } from '../contract'
import { Contract } from 'web3-eth-contract'
import { SnapshotProvider } from '../../services/SnapshotProvider'

describe('getRequiredBlockConfirmations', () => {
  const methodsBuilder = (value: string) => ({
    requiredBlockConfirmations: () => {
      return {
        call: () => {
          return value
        }
      }
    }
  })

  test('Should call requiredBlockConfirmations method if no events present', async () => {
    const contract = ({
      getPastEvents: () => {
        return []
      },
      methods: methodsBuilder('1')
    } as unknown) as Contract

    const snapshotProvider = ({
      requiredBlockConfirmationEvents: () => {
        return []
      },
      snapshotBlockNumber: () => {
        return 10
      }
    } as unknown) as SnapshotProvider

    const result = await getRequiredBlockConfirmations(contract, 10, snapshotProvider)

    expect(result).toEqual(1)
  })
  test('Should not call to get events if block number was included in the snapshot', async () => {
    const contract = ({
      getPastEvents: jest.fn().mockImplementation(() => []),
      methods: methodsBuilder('3')
    } as unknown) as Contract

    const snapshotProvider = ({
      requiredBlockConfirmationEvents: () => {
        return [
          {
            blockNumber: 8,
            returnValues: {
              requiredBlockConfirmations: '1'
            }
          }
        ]
      },
      snapshotBlockNumber: () => {
        return 15
      }
    } as unknown) as SnapshotProvider

    const result = await getRequiredBlockConfirmations(contract, 10, snapshotProvider)

    expect(result).toEqual(1)
    expect(contract.getPastEvents).toBeCalledTimes(0)
  })
  test('Should call to get events if block number was not included in the snapshot', async () => {
    const contract = ({
      getPastEvents: jest.fn().mockImplementation(() => [
        {
          blockNumber: 9,
          returnValues: {
            requiredBlockConfirmations: '2'
          }
        }
      ]),
      methods: methodsBuilder('3')
    } as unknown) as Contract

    const snapshotProvider = ({
      requiredBlockConfirmationEvents: () => {
        return [
          {
            blockNumber: 8,
            returnValues: {
              requiredBlockConfirmations: '1'
            }
          }
        ]
      },
      snapshotBlockNumber: () => {
        return 8
      }
    } as unknown) as SnapshotProvider

    const result = await getRequiredBlockConfirmations(contract, 10, snapshotProvider)

    expect(result).toEqual(2)
    expect(contract.getPastEvents).toBeCalledTimes(1)
    expect(contract.getPastEvents).toHaveBeenCalledWith('RequiredBlockConfirmationChanged', {
      fromBlock: 9,
      toBlock: 10
    })
  })
  test('Should use the most updated event', async () => {
    const contract = ({
      getPastEvents: jest.fn().mockImplementation(() => [
        {
          blockNumber: 9,
          returnValues: {
            requiredBlockConfirmations: '2'
          }
        },
        {
          blockNumber: 11,
          returnValues: {
            requiredBlockConfirmations: '3'
          }
        }
      ]),
      methods: methodsBuilder('3')
    } as unknown) as Contract

    const snapshotProvider = ({
      requiredBlockConfirmationEvents: () => {
        return []
      },
      snapshotBlockNumber: () => {
        return 11
      }
    } as unknown) as SnapshotProvider

    const result = await getRequiredBlockConfirmations(contract, 15, snapshotProvider)

    expect(result).toEqual(3)
    expect(contract.getPastEvents).toBeCalledTimes(1)
    expect(contract.getPastEvents).toHaveBeenCalledWith('RequiredBlockConfirmationChanged', {
      fromBlock: 12,
      toBlock: 15
    })
  })
})
describe('getRequiredSignatures', () => {
  test('Should not call to get events if block number was included in the snapshot', async () => {
    const contract = ({
      getPastEvents: jest.fn().mockImplementation(() => [])
    } as unknown) as Contract

    const snapshotProvider = ({
      requiredSignaturesEvents: () => {
        return [
          {
            blockNumber: 7,
            returnValues: {
              requiredSignatures: '1'
            }
          },
          {
            blockNumber: 8,
            returnValues: {
              requiredSignatures: '2'
            }
          }
        ]
      },
      snapshotBlockNumber: () => {
        return 10
      }
    } as unknown) as SnapshotProvider

    const result = await getRequiredSignatures(contract, 10, snapshotProvider)

    expect(result).toEqual(2)
    expect(contract.getPastEvents).toBeCalledTimes(0)
  })
  test('Should call to get events if block number is higher than the snapshot block number', async () => {
    const contract = ({
      getPastEvents: jest.fn().mockImplementation(() => [
        {
          blockNumber: 15,
          returnValues: {
            requiredSignatures: '3'
          }
        }
      ])
    } as unknown) as Contract

    const snapshotProvider = ({
      requiredSignaturesEvents: () => {
        return [
          {
            blockNumber: 7,
            returnValues: {
              requiredSignatures: '1'
            }
          },
          {
            blockNumber: 8,
            returnValues: {
              requiredSignatures: '2'
            }
          }
        ]
      },
      snapshotBlockNumber: () => {
        return 10
      }
    } as unknown) as SnapshotProvider

    const result = await getRequiredSignatures(contract, 20, snapshotProvider)

    expect(result).toEqual(3)
    expect(contract.getPastEvents).toBeCalledTimes(1)
    expect(contract.getPastEvents).toHaveBeenCalledWith('RequiredSignaturesChanged', {
      fromBlock: 11,
      toBlock: 20
    })
  })
  test('Should use the most updated event before the block number', async () => {
    const contract = ({
      getPastEvents: jest.fn().mockImplementation(() => [
        {
          blockNumber: 15,
          returnValues: {
            requiredSignatures: '4'
          }
        }
      ])
    } as unknown) as Contract

    const snapshotProvider = ({
      requiredSignaturesEvents: () => {
        return [
          {
            blockNumber: 5,
            returnValues: {
              requiredSignatures: '1'
            }
          },
          {
            blockNumber: 6,
            returnValues: {
              requiredSignatures: '2'
            }
          }
        ]
      },
      snapshotBlockNumber: () => {
        return 10
      }
    } as unknown) as SnapshotProvider

    const result = await getRequiredSignatures(contract, 7, snapshotProvider)

    expect(result).toEqual(2)
    expect(contract.getPastEvents).toBeCalledTimes(0)
  })
})
