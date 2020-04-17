import { Mediator } from '../burner-wallet'
import { HOME_NATIVE_TO_ERC_ABI, FOREIGN_NATIVE_TO_ERC_ABI } from '../../../../commons'
import { waitForEvent, isBridgeContract } from '../utils'

export default class WETCBridge extends Mediator {
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
    const listenToBridgeEvent = await isBridgeContract(contract)
    if (listenToBridgeEvent) {
      await waitForEvent(web3, contract, 'AffirmationCompleted', this.processBridgeEvents(sendResult.txHash))
    } else {
      await super.detectExchangeBToAFinished(account, value, sendResult)
    }
  }

  async detectExchangeAToBFinished(account, value, sendResult) {
    const web3 = this.getExchange()
      .getAsset(this.assetB)
      .getWeb3()
    const contract = new web3.eth.Contract(FOREIGN_NATIVE_TO_ERC_ABI, this.assetBBridge)
    const listenToBridgeEvent = await isBridgeContract(contract)
    if (listenToBridgeEvent) {
      await waitForEvent(web3, contract, 'RelayedMessage', this.processBridgeEvents(sendResult.txHash))
    } else {
      await super.detectExchangeAToBFinished(account, value, sendResult)
    }
  }

  processBridgeEvents(txHash) {
    return events => {
      const confirmationEvent = events.filter(event => event.returnValues.transactionHash === txHash)
      return confirmationEvent.length > 0
    }
  }
}
