import BN from 'bn.js'
import { Bridge, ValueTypes } from '@burner-wallet/exchange'
import { waitForEvent } from '../../utils'
import { MEDIATOR_ABI, MEDIATOR_FEE_MANAGER_ABI } from '../../../../../commons'
import { toBN } from 'web3-utils'

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
    const contract = new web3.eth.Contract(MEDIATOR_ABI, this.assetABridge)
    await waitForEvent(web3, contract, 'TokensBridged', this.processMediatorEvents(account))
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async detectExchangeAToBFinished(account, value, sendResult) {
    const web3 = this.getExchange()
      .getAsset(this.assetB)
      .getWeb3()
    const contract = new web3.eth.Contract(MEDIATOR_ABI, this.assetBBridge)
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

  async estimateAtoB(value: ValueTypes) {
    const web3 = this.getExchange()
      .getAsset(this.assetB)
      .getWeb3()

    const userAmount = this._getValue(value)

    const contract = new web3.eth.Contract(MEDIATOR_ABI, this.assetBBridge)
    const feeAmount = await this.getFeeAmount(web3, contract, userAmount)
    const finalAmount = toBN(userAmount).sub(feeAmount)

    return finalAmount.toString()
  }

  async estimateBtoA(value: ValueTypes) {
    const web3 = this.getExchange()
      .getAsset(this.assetA)
      .getWeb3()

    const userAmount = this._getValue(value)

    const contract = new web3.eth.Contract(MEDIATOR_ABI, this.assetABridge)
    const feeAmount = await this.getFeeAmount(web3, contract, userAmount)
    const finalAmount = toBN(userAmount).sub(feeAmount)

    return finalAmount.toString()
  }

  async getFeeAmount(web3, contract, value): Promise<BN> {
    const feeManagerAddress = await contract.methods.feeManagerContract().call()

    const feeManagerContract = new web3.eth.Contract(MEDIATOR_FEE_MANAGER_ABI, feeManagerAddress)
    return toBN(await feeManagerContract.methods.calculateFee(value).call())
  }
}
