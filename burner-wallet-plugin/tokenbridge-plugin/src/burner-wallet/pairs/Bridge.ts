import { Pair } from '@burner-wallet/exchange'

export interface ValueTypes {
  value?: string
  ether?: string
}

export interface ExchangeParams extends ValueTypes {
  account: string
}

interface PairConstructor {
  assetA: string
  assetABridge: string
  assetB: string
  assetBBridge: string
}

export default class Bridge extends Pair {
  private readonly assetABridge: string
  private readonly assetBBridge: string

  constructor({ assetA, assetABridge, assetB, assetBBridge }: PairConstructor) {
    super({ assetA, assetB })
    this.assetABridge = assetABridge
    this.assetBBridge = assetBBridge
  }

  exchangeAtoB({ account, value, ether }: ExchangeParams) {
    const _value = this._getValue({ value, ether })
    const etc = this.getExchange().getAsset(this.assetA)
    return etc.send({
      from: account,
      value: _value,
      to: this.assetABridge
    })
  }

  exchangeBtoA({ account, value, ether }: ExchangeParams) {
    const _value = this._getValue({ value, ether })

    const wetc = this.getExchange().getAsset(this.assetB)
    return wetc.send({
      from: account,
      value: _value,
      to: this.assetBBridge
    })
  }

  async estimateAtoB(value: ValueTypes) {
    return this._getValue(value)
  }

  async estimateBtoA(value: ValueTypes) {
    return this._getValue(value)
  }
}
