import { Bridge } from '@burner-wallet/exchange'
import { EventData } from 'web3-eth-contract'
import { wait, constants } from '../utils'
import { HOME_NATIVE_TO_ERC_ABI, FOREIGN_NATIVE_TO_ERC_ABI } from '../../../../commons'

export default class WETCBridge extends Bridge {
  constructor() {
    super({
      assetA: 'etc',
      assetABridge: '0x073081832B4Ecdce79d4D6753565c85Ba4b3BeA9',
      assetB: 'wetc',
      assetBBridge: '0x0cB781EE62F815bdD9CD4c2210aE8600d43e7040'
    })
  }

  async detectExchangeBToAFinished(account, value, sendResult) {
    const asset = this.getExchange().getAsset(this.assetA)
    const web3 = asset.getWeb3()
    const contract = new web3.eth.Contract(HOME_NATIVE_TO_ERC_ABI, this.assetABridge)
    await this.waitForBridgeEvent(web3, contract, 'AffirmationCompleted', sendResult.txHash)
  }

  async detectExchangeAToBFinished(account, value, sendResult) {
    const web3 = this.getExchange()
      .getAsset(this.assetB)
      .getWeb3()
    const contract = new web3.eth.Contract(FOREIGN_NATIVE_TO_ERC_ABI, this.assetBBridge)
    await this.waitForBridgeEvent(web3, contract, 'RelayedMessage', sendResult.txHash)
  }

  async waitForBridgeEvent(web3, contract, event, txHash) {
    let fromBlock = await web3.eth.getBlockNumber()

    const stopTime = Date.now() + constants.EXCHANGE_TIMEOUT
    while (Date.now() <= stopTime) {
      const currentBlock = await web3.eth.getBlockNumber()
      const events: EventData[] = await contract.getPastEvents(event, {
        fromBlock,
        toBlock: currentBlock
      })
      const confirmationEvent = events.filter(event => event.returnValues.transactionHash === txHash)

      if (confirmationEvent.length > 0) {
        return
      }
      fromBlock = currentBlock
      await wait(10000)
    }
  }
}
