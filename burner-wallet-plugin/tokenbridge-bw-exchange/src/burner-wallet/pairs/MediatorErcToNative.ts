import BN from 'bn.js'
import { EstimateReturn, ValueTypes } from '@burner-wallet/exchange'
import { constants } from '../../utils'
import { MEDIATOR_ERC_TO_NATIVE_ABI } from '../../utils'
import { default as Mediator } from './Mediator'
import { fromWei, toBN } from 'web3-utils'

export default class MediatorErcToNative extends Mediator {
  constructor(params) {
    super(params)
  }

  async estimateAtoB(value: ValueTypes): Promise<EstimateReturn> {
    return this.estimateWithFee(constants.HOME_TO_FOREIGN_FEE_TYPE, value)
  }

  async estimateBtoA(value: ValueTypes): Promise<EstimateReturn> {
    return this.estimateWithFee(constants.FOREIGN_TO_HOME_FEE_TYPE, value)
  }

  async estimateWithFee(feeType: string, value: ValueTypes): Promise<EstimateReturn> {
    const web3 = this.getExchange()
      .getAsset(this.assetA)
      .getWeb3()

    const userAmount = this._getValue(value)

    const contract = new web3.eth.Contract(MEDIATOR_ERC_TO_NATIVE_ABI, this.assetABridge)
    const { feeAmount, feePercentage } = await this.getFee(feeType, contract, userAmount)
    const finalAmount = toBN(userAmount).sub(feeAmount)
    const estimateInfo = feeAmount.isZero() ? null : `${constants.ESTIMATE_FEE_MESSAGE} Fee: ${feePercentage}%`

    return {
      estimate: finalAmount.toString(),
      estimateInfo
    }
  }

  async getFee(feeType, contract, value): Promise<{ feeAmount: BN; feePercentage: number }> {
    const fee = toBN(await contract.methods.getFee(feeType).call())
    const feePercentage = Number(fromWei(fee, 'ether')) * 100
    const feeAmount = toBN(await contract.methods.calculateFee(feeType, value).call())
    return {
      feeAmount,
      feePercentage
    }
  }
}
