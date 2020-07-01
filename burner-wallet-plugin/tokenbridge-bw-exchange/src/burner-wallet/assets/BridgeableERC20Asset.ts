import { ERC20Asset } from '@burner-wallet/assets'
import { MEDIATOR_ABI, constants } from '../../utils'
import { toBN } from 'web3-utils'

interface BridgeableERC20Constructor {
  abi?: object
  address: string
  id: string
  name: string
  network: string
  bridgeAddress: string
}

export default class BridgeableERC20Asset extends ERC20Asset {
  protected bridgeAddress: string
  private _bridge

  constructor({ bridgeAddress, ...params }: BridgeableERC20Constructor) {
    super({ ...params })
    this.bridgeAddress = bridgeAddress.toLowerCase()
  }

  getBridgeContract() {
    if (!this._bridge) {
      const Contract = this.getWeb3().eth.Contract
      this._bridge = new Contract(MEDIATOR_ABI, this.bridgeAddress)
    }
    return this._bridge
  }

  async _send({ from, to, value }) {
    if (to.toLowerCase() === this.bridgeAddress) {
      const allowance = await this.allowance(from, to)
      if (toBN(allowance).lt(toBN(value))) {
        await this.approve(from, to, value)
      }
      const receipt = await this.getBridgeContract()
        .methods.relayTokens(from, value)
        .send({ from })
      const transferLog = Object.values(receipt.events as object).find(
        e => e.raw.topics[0] === constants.TRANSFER_TOPIC
      )
      return {
        ...receipt,
        txHash: receipt.transactionHash,
        id: `${receipt.transactionHash}-${transferLog.logIndex}`
      }
    }
    return super._send({ from, to, value })
  }
}
