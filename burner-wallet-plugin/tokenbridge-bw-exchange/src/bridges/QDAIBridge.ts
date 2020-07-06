import { MediatorErcToNative } from '../burner-wallet'

export default class QDAIBridge extends MediatorErcToNative {
  constructor() {
    super({
      assetA: 'qdai',
      assetABridge: '0xFEaB457D95D9990b7eb6c943c839258245541754',
      assetB: 'dai',
      assetBBridge: '0xf6edFA16926f30b0520099028A145F4E06FD54ed'
    })
  }
}
