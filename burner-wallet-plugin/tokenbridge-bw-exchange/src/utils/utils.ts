import { EventData, Contract } from 'web3-eth-contract'
import { toWei } from 'web3-utils'

export const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time))

export const constants = {
  EXCHANGE_TIMEOUT: 300000,
  MAX_FEE: toWei('1', 'ether'),
  ESTIMATE_FEE_MESSAGE: 'Estimation takes fee charges into consideration.',
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
  TRANSFER_TOPIC: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  // fee types are taken from contracts/upgradeable_contracts/amb_erc20_to_native/HomeFeeManagerAMBErc20ToNative.sol
  HOME_TO_FOREIGN_FEE_TYPE: '0x741ede137d0537e88e0ea0ff25b1f22d837903dbbee8980b4a06e8523247ee26',
  FOREIGN_TO_HOME_FEE_TYPE: '0x03be2b2875cb41e0e77355e802a16769bb8dfcf825061cde185c73bf94f12625'
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

export const isVanillaBridgeContract = async (contract: Contract): Promise<boolean> => {
  try {
    await contract.methods.deployedAtBlock().call()
    return true
  } catch (e) {
    return false
  }
}

export const isBridgeContract = async (contract: Contract, allowedModes?: string[]): Promise<boolean> => {
  try {
    const mode = await contract.methods.getBridgeMode().call()
    if (typeof allowedModes === 'undefined') {
      return true
    }
    return allowedModes.includes(mode)
  } catch (e) {
    return false
  }
}
