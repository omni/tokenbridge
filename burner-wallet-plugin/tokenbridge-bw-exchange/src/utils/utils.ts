import { EventData, Contract } from 'web3-eth-contract'
import { toWei } from 'web3-utils'

export const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time))

export const constants = {
  EXCHANGE_TIMEOUT: 300000,
  MAX_FEE: toWei('1', 'ether')
}

export const waitForEvent = async (web3, contract: Contract, event: string, callback: Function) => {
  let fromBlock = await web3.eth.getBlockNumber()

  const stopTime = Date.now() + constants.EXCHANGE_TIMEOUT
  while (Date.now() <= stopTime) {
    const currentBlock = await web3.eth.getBlockNumber()
    const events: EventData[] = await contract.getPastEvents(event, {
      fromBlock,
      toBlock: currentBlock
    })
    const eventFound = await callback(events)

    if (eventFound) {
      return
    }
    fromBlock = currentBlock
    await wait(10000)
  }
}

export const isBridgeContract = async (contract: Contract): Promise<boolean> => {
  try {
    await contract.methods.deployedAtBlock().call()
    return true
  } catch (e) {
    return false
  }
}
