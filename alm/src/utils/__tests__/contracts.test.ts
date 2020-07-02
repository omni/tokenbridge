import 'jest'
import { getRequiredBlockConfirmations } from '../contract'
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
})
