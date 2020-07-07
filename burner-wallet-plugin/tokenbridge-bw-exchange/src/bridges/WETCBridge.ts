import { Mediator } from '../burner-wallet'
import { HOME_NATIVE_TO_ERC_ABI, FOREIGN_NATIVE_TO_ERC_ABI } from '../utils'
import { waitForEvent, isVanillaBridgeContract, constants } from '../utils'
import { ValueTypes } from '@burner-wallet/exchange'
import { toBN, fromWei } from 'web3-utils'

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
    const web3 = this.getExchange()
      .getAsset(this.assetA)
      .getWeb3()
    const contract = new web3.eth.Contract(HOME_NATIVE_TO_ERC_ABI, this.assetABridge)
    const listenToBridgeEvent = await isVanillaBridgeContract(contract)
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
    const listenToBridgeEvent = await isVanillaBridgeContract(contract)
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

  async estimateAtoB(value: ValueTypes) {
    const web3 = this.getExchange()
      .getAsset(this.assetB)
      .getWeb3()
    const contract = new web3.eth.Contract(FOREIGN_NATIVE_TO_ERC_ABI, this.assetBBridge)

    const useBridgeContract = await isVanillaBridgeContract(contract)

    if (useBridgeContract) {
      const fee = toBN(await contract.methods.getHomeFee().call())
      const feeAmount = toBN(this._getValue(value))
        .mul(fee)
        .div(toBN(constants.MAX_FEE))
      const finalAmount = toBN(this._getValue(value)).sub(feeAmount)
      const feePercentage = Number(fromWei(fee, 'ether')) * 100
      const estimateInfo = feeAmount.isZero() ? null : `${constants.ESTIMATE_FEE_MESSAGE} Fee: ${feePercentage}%`

      return {
        estimate: finalAmount.toString(),
        estimateInfo
      }
    } else {
      return await super.estimateAtoB(value)
    }
  }

  async estimateBtoA(value: ValueTypes) {
    const web3 = this.getExchange()
      .getAsset(this.assetA)
      .getWeb3()
    const contract = new web3.eth.Contract(HOME_NATIVE_TO_ERC_ABI, this.assetABridge)

    const useBridgeContract = await isVanillaBridgeContract(contract)

    if (useBridgeContract) {
      const fee = toBN(await contract.methods.getForeignFee().call())
      const feeAmount = toBN(this._getValue(value))
        .mul(fee)
        .div(toBN(constants.MAX_FEE))
      const finalAmount = toBN(this._getValue(value)).sub(feeAmount)
      const feePercentage = Number(fromWei(fee, 'ether')) * 100
      const estimateInfo = feeAmount.isZero() ? null : `${constants.ESTIMATE_FEE_MESSAGE} Fee: ${feePercentage}%`
      return {
        estimate: finalAmount.toString(),
        estimateInfo
      }
    } else {
      return await super.estimateBtoA(value)
    }
  }
}
