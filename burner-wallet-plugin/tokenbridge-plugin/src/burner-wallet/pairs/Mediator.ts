import { Bridge } from '@burner-wallet/exchange'
import { waitForEvent } from '../../utils'
import { MEDIATOR_EVENT_ABI } from '../../../../../commons'

interface MediatorConstructor {
  assetA: string
  assetABridge: string
  assetB: string
  assetBBridge: string
}

export default class Mediator extends Bridge {
  constructor({ assetA, assetABridge, assetB, assetBBridge }: MediatorConstructor) {
    super({ assetA, assetABridge, assetB, assetBBridge })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async detectExchangeBToAFinished(account, value, sendResult) {
    const asset = this.getExchange().getAsset(this.assetA)
    const web3 = asset.getWeb3()
    const contract = new web3.eth.Contract(MEDIATOR_EVENT_ABI, this.assetABridge)
    await waitForEvent(web3, contract, 'TokensBridged', this.processMediatorEvents(account))
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async detectExchangeAToBFinished(account, value, sendResult) {
    const web3 = this.getExchange()
      .getAsset(this.assetB)
      .getWeb3()
    const contract = new web3.eth.Contract(MEDIATOR_EVENT_ABI, this.assetBBridge)
    await waitForEvent(web3, contract, 'TokensBridged', this.processMediatorEvents(account))
  }

  processMediatorEvents(account) {
    return events => {
      const confirmationEvent = events.filter(
        event => event.returnValues.recipient.toLowerCase() === account.toLowerCase()
      )
      return confirmationEvent.length > 0
    }
  }
}
