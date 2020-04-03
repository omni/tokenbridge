import Bridge from './Bridge'

export default class WETCBridge extends Bridge {
  constructor() {
    super({
      assetA: 'etc',
      assetABridge: '0x073081832B4Ecdce79d4D6753565c85Ba4b3BeA9',
      assetB: 'wetc',
      assetBBridge: '0x0cB781EE62F815bdD9CD4c2210aE8600d43e7040'
    })
  }
}
