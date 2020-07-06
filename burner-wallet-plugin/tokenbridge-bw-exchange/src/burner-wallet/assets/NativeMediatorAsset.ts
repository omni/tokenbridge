import { NativeAsset } from '@burner-wallet/assets'
import { Contract, EventData } from 'web3-eth-contract'
import { MEDIATOR_ABI } from '../../utils'
import { AssetConstructor } from '@burner-wallet/assets/Asset'

interface NativeMediatorConstructor extends AssetConstructor {
  mediatorAddress?: string
}

export default class NativeMediatorAsset extends NativeAsset {
  protected mediatorAddress: string

  constructor({ mediatorAddress = '', ...params }: NativeMediatorConstructor) {
    super({ ...params })
    this.mediatorAddress = mediatorAddress
  }

  async scanBlocks(address, fromBlock, toBlock) {
    await super.scanBlocks(address, fromBlock, toBlock)
    await this.scanMediatorEvents(address, fromBlock, toBlock)
  }

  async getTx(txHash) {
    const historyEvents = this.core.getHistoryEvents({ asset: this.id, account: this.mediatorAddress })
    const eventMatch = historyEvents.filter(e => e.tx === txHash)
    if (eventMatch.length > 0) {
      return eventMatch[0]
    } else {
      return super.getTx(txHash)
    }
  }

  async scanMediatorEvents(address, fromBlock, toBlock) {
    if (this.mediatorAddress != '') {
      const web3 = this.getWeb3()
      const contract: Contract = new web3.eth.Contract(MEDIATOR_ABI, this.mediatorAddress)
      const events: EventData[] = await contract.getPastEvents('TokensBridged', {
        fromBlock,
        toBlock,
        filter: {
          recipient: address
        }
      })

      for (const event of events) {
        this.core.addHistoryEvent({
          id: `${event.transactionHash}-${event.logIndex}`,
          asset: this.id,
          type: 'send',
          value: event.returnValues.value.toString(),
          from: this.mediatorAddress,
          to: event.returnValues.recipient,
          tx: event.transactionHash,
          timestamp: await this._getBlockTimestamp(event.blockNumber)
        })
      }
    }
  }

  setMediatorAddress(mediatorAddress) {
    this.mediatorAddress = mediatorAddress
  }
}
