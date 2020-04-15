import { Bridge } from '@burner-wallet/exchange'

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

  async detectExchangeBToAFinished(account, value, sendResult) {
    console.log('Detecting exchange finalization is not implemented in Mediator yet')
  }

  async detectExchangeAToBFinished(account, value, sendResult) {
    console.log('Detecting exchange finalization is not implemented in Mediator yet')
  }
}
