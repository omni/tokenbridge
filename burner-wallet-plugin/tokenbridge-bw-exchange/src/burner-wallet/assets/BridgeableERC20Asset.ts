import { ERC20Asset } from '@burner-wallet/assets'
import { AssetConstructor } from '@burner-wallet/assets/Asset'
import { MEDIATOR_ABI, constants, isBridgeContract } from '../../utils'
import { toBN, soliditySha3 } from 'web3-utils'

interface BridgeableERC20Constructor extends AssetConstructor {
  abi?: object
  address: string
  bridgeModes: string[]
}

export default class BridgeableERC20Asset extends ERC20Asset {
  private _bridgeModes
  private _bridges: { [addr: string]: object | false }

  public set bridgeModes(bridgeModes: string[]) {
    this._bridgeModes = bridgeModes.map(s => soliditySha3(s)!.slice(0, 10))
  }

  public get bridgeModes() {
    return this._bridgeModes
  }

  constructor({
    bridgeModes = ['erc-to-native-core', 'erc-to-native-amb', 'erc-to-erc-core', 'erc-to-erc-amb'],
    ...params
  }: BridgeableERC20Constructor) {
    super(params)
    this._bridges = {}
    this.bridgeModes = bridgeModes
  }

  async getBridgeContract(addr: string) {
    if (typeof this._bridges[addr] === 'undefined') {
      const Contract = this.getWeb3().eth.Contract
      const bridge = new Contract(MEDIATOR_ABI, addr)
      if (await isBridgeContract(bridge, this.bridgeModes)) {
        return (this._bridges[addr] = bridge)
      }
      return (this._bridges[addr] = false)
    }
    return this._bridges[addr]
  }

  async _send({ from, to, value }) {
    const bridge = await this.getBridgeContract(to)
    if (bridge) {
      const allowance = await this.allowance(from, to)
      if (toBN(allowance).lt(toBN(value))) {
        await this.approve(from, to, value)
      }
      const receipt = await bridge.methods.relayTokens(from, value).send({ from })
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
