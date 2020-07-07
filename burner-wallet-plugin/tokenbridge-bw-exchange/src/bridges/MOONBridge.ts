import { Mediator } from '../burner-wallet'

export default class MOONBridge extends Mediator {
  constructor() {
    super({
      assetA: 'xmoon',
      assetABridge: '0x1E0507046130c31DEb20EC2f870ad070Ff266079',
      assetB: 'moon',
      assetBBridge: '0xFEaB457D95D9990b7eb6c943c839258245541754'
    })
  }
}
