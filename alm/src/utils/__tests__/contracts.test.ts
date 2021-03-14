import 'jest'
import { getRequiredBlockConfirmations, getRequiredSignatures, getValidatorList } from '../contract'
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
      getPastEvents: async () => {
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
      getPastEvents: jest.fn().mockImplementation(async () => []),
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
      getPastEvents: jest.fn().mockImplementation(async () => [
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
      getPastEvents: jest.fn().mockImplementation(async () => [
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
      getPastEvents: jest.fn().mockImplementation(async () => [])
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
      getPastEvents: jest.fn().mockImplementation(async () => [
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
      getPastEvents: jest.fn().mockImplementation(async () => [
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
describe('getValidatorList', () => {
  const validator1 = '0x45b96809336A8b714BFbdAB3E4B5e0fe5d839908'
  const validator2 = '0xAe8bFfc8BBc6AAa9E21ED1E4e4957fe798BEA25f'
  const validator3 = '0x285A6eB779be4db94dA65e2F3518B1c5F0f71244'
  const methodsBuilder = (value: string[]) => ({
    validatorList: () => {
      return {
        call: () => {
          return value
        }
      }
    }
  })
  test('Should return the current validator list if no events found', async () => {
    const currentValidators = [validator1, validator2, validator3]
    const contract = ({
      getPastEvents: jest.fn().mockImplementation(async () => []),
      methods: methodsBuilder(currentValidators)
    } as unknown) as Contract

    const snapshotProvider = ({
      validatorAddedEvents: () => {
        return []
      },
      validatorRemovedEvents: () => {
        return []
      },
      snapshotBlockNumber: () => {
        return 10
      }
    } as unknown) as SnapshotProvider

    const list = await getValidatorList(contract, 20, snapshotProvider)

    expect(list.length).toEqual(3)
    expect(list).toEqual(expect.arrayContaining(currentValidators))
    expect(contract.getPastEvents).toBeCalledTimes(2)
    expect(contract.getPastEvents).toHaveBeenCalledWith('ValidatorAdded', {
      fromBlock: 20
    })
    expect(contract.getPastEvents).toHaveBeenCalledWith('ValidatorRemoved', {
      fromBlock: 20
    })
  })
  test('If validator was added later from snapshot it should not include it', async () => {
    const currentValidators = [validator1, validator2, validator3]
    const contract = ({
      getPastEvents: jest.fn().mockImplementation(async () => []),
      methods: methodsBuilder(currentValidators)
    } as unknown) as Contract

    const snapshotProvider = ({
      validatorAddedEvents: () => {
        return [
          {
            blockNumber: 9,
            returnValues: {
              validator: validator3
            },
            event: 'ValidatorAdded'
          }
        ]
      },
      validatorRemovedEvents: () => {
        return []
      },
      snapshotBlockNumber: () => {
        return 10
      }
    } as unknown) as SnapshotProvider

    const list = await getValidatorList(contract, 5, snapshotProvider)

    expect(list.length).toEqual(2)
    expect(list).toEqual(expect.arrayContaining([validator1, validator2]))
    expect(contract.getPastEvents).toBeCalledTimes(2)
    expect(contract.getPastEvents).toHaveBeenCalledWith('ValidatorAdded', {
      fromBlock: 11
    })
    expect(contract.getPastEvents).toHaveBeenCalledWith('ValidatorRemoved', {
      fromBlock: 11
    })
  })
  test('If validator was added later from chain it should not include it', async () => {
    const currentValidators = [validator1, validator2, validator3]
    const contract = ({
      getPastEvents: jest.fn().mockImplementation(async event => {
        if (event === 'ValidatorAdded') {
          return [
            {
              blockNumber: 9,
              returnValues: {
                validator: validator3
              },
              event: 'ValidatorAdded'
            }
          ]
        } else {
          return []
        }
      }),
      methods: methodsBuilder(currentValidators)
    } as unknown) as Contract

    const snapshotProvider = ({
      validatorAddedEvents: () => {
        return []
      },
      validatorRemovedEvents: () => {
        return []
      },
      snapshotBlockNumber: () => {
        return 10
      }
    } as unknown) as SnapshotProvider

    const list = await getValidatorList(contract, 15, snapshotProvider)

    expect(list.length).toEqual(2)
    expect(list).toEqual(expect.arrayContaining([validator1, validator2]))
    expect(contract.getPastEvents).toBeCalledTimes(2)
    expect(contract.getPastEvents).toHaveBeenCalledWith('ValidatorAdded', {
      fromBlock: 15
    })
    expect(contract.getPastEvents).toHaveBeenCalledWith('ValidatorRemoved', {
      fromBlock: 15
    })
  })
  test('If validator was removed later from snapshot it should include it', async () => {
    const currentValidators = [validator1, validator2]
    const contract = ({
      getPastEvents: jest.fn().mockImplementation(async () => []),
      methods: methodsBuilder(currentValidators)
    } as unknown) as Contract

    const snapshotProvider = ({
      validatorAddedEvents: () => {
        return []
      },
      validatorRemovedEvents: () => {
        return [
          {
            blockNumber: 9,
            returnValues: {
              validator: validator3
            },
            event: 'ValidatorRemoved'
          }
        ]
      },
      snapshotBlockNumber: () => {
        return 10
      }
    } as unknown) as SnapshotProvider

    const list = await getValidatorList(contract, 5, snapshotProvider)

    expect(list.length).toEqual(3)
    expect(list).toEqual(expect.arrayContaining([validator1, validator2, validator3]))
    expect(contract.getPastEvents).toBeCalledTimes(2)
    expect(contract.getPastEvents).toHaveBeenCalledWith('ValidatorAdded', {
      fromBlock: 11
    })
    expect(contract.getPastEvents).toHaveBeenCalledWith('ValidatorRemoved', {
      fromBlock: 11
    })
  })
  test('If validator was removed later from chain it should include it', async () => {
    const currentValidators = [validator1, validator2]
    const contract = ({
      getPastEvents: jest.fn().mockImplementation(async event => {
        if (event === 'ValidatorRemoved') {
          return [
            {
              blockNumber: 9,
              returnValues: {
                validator: validator3
              },
              event: 'ValidatorRemoved'
            }
          ]
        } else {
          return []
        }
      }),
      methods: methodsBuilder(currentValidators)
    } as unknown) as Contract

    const snapshotProvider = ({
      validatorAddedEvents: () => {
        return []
      },
      validatorRemovedEvents: () => {
        return []
      },
      snapshotBlockNumber: () => {
        return 10
      }
    } as unknown) as SnapshotProvider

    const list = await getValidatorList(contract, 15, snapshotProvider)

    expect(list.length).toEqual(3)
    expect(list).toEqual(expect.arrayContaining([validator1, validator2, validator3]))
    expect(contract.getPastEvents).toBeCalledTimes(2)
    expect(contract.getPastEvents).toHaveBeenCalledWith('ValidatorAdded', {
      fromBlock: 15
    })
    expect(contract.getPastEvents).toHaveBeenCalledWith('ValidatorRemoved', {
      fromBlock: 15
    })
  })
})
