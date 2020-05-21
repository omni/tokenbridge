import BN from 'bn.js'
import { Bridge, EstimateReturn, ValueTypes } from '@burner-wallet/exchange'
import { waitForEvent, constants } from '../../utils'
import { MEDIATOR_ABI, MEDIATOR_FEE_MANAGER_ABI } from '../../utils'
import { fromWei, toBN } from 'web3-utils'

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

  async estimateAtoB(value: ValueTypes): Promise<EstimateReturn> {
    const web3 = this.getExchange()
      .getAsset(this.assetB)
      .getWeb3()

    const userAmount = this._getValue(value)

    const contract = new web3.eth.Contract(MEDIATOR_ABI, this.assetBBridge)
    const { feeAmount, feePercentage } = await this.getFee(web3, contract, userAmount)
    const finalAmount = toBN(userAmount).sub(feeAmount)
    const estimateInfo = feeAmount.isZero() ? null : `${constants.ESTIMATE_FEE_MESSAGE} Fee: ${feePercentage}%`

    return {
      estimate: finalAmount.toString(),
      estimateInfo
    }
  }

  async estimateBtoA(value: ValueTypes): Promise<EstimateReturn> {
    const web3 = this.getExchange()
      .getAsset(this.assetA)
      .getWeb3()

    const userAmount = this._getValue(value)

    const contract = new web3.eth.Contract(MEDIATOR_ABI, this.assetABridge)
    const { feeAmount, feePercentage } = await this.getFee(web3, contract, userAmount)
    const finalAmount = toBN(userAmount).sub(feeAmount)
    const estimateInfo = feeAmount.isZero() ? null : `${constants.ESTIMATE_FEE_MESSAGE} Fee: ${feePercentage}%`

    return {
      estimate: finalAmount.toString(),
      estimateInfo
    }
  }

  async getFee(web3, contract, value): Promise<{ feeAmount: BN; feePercentage: number }> {
    const feeManagerAddress = await this.getFeeManagerContract(contract)
    if (feeManagerAddress != constants.ZERO_ADDRESS) {
      const feeManagerContract = new web3.eth.Contract(MEDIATOR_FEE_MANAGER_ABI, feeManagerAddress)
      const fee = toBN(await feeManagerContract.methods.fee().call())
      const feePercentage = Number(fromWei(fee, 'ether')) * 100
      const feeAmount = toBN(await feeManagerContract.methods.calculateFee(value).call())
      return {
        feeAmount,
        feePercentage
      }
    } else {
      return {
        feeAmount: toBN(0),
        feePercentage: 0
      }
    }
  }

  async getFeeManagerContract(contract) {
    try {
      return await contract.methods.feeManagerContract().call()
    } catch (e) {
      return constants.ZERO_ADDRESS
    }
  }
}
