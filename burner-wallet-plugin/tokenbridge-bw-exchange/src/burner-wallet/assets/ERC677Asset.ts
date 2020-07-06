import { ERC20Asset } from '@burner-wallet/assets'
import { AssetConstructor } from '@burner-wallet/assets/Asset'
import { ERC677_ABI, constants } from '../../utils'

const BLOCK_LOOKBACK = 250

interface ERC677Constructor extends AssetConstructor {
  abi?: object
  address: string
}

export default class ERC677Asset extends ERC20Asset {
  constructor({ abi = ERC677_ABI, ...params }: ERC677Constructor) {
    super({ abi, type: 'erc677', ...params })
  }

  async _send({ from, to, value }) {
    const receipt = await this.getContract()
      .methods.transferAndCall(to, value, '0x')
      .send({ from })
    return {
      ...receipt,
      txHash: receipt.transactionHash,
      id: `${receipt.transactionHash}-${receipt.events.Transfer.logIndex}`
    }
  }

  /**
   * Overrides ERC20Asset `startWatchingAddress` to get the `Transfer` events by topic instead of
   * the event name because ERC677 abi has two events definitions named `Transfer` and
   * `getPastEvents` method does not provide a way to choose the correct one to use.
   * @param address
   */
  startWatchingAddress(address) {
    let block = 0
    return this.poll(async () => {
      const currentBlock = await this.getWeb3().eth.getBlockNumber()
      if (block === 0) {
        block = Math.max(currentBlock - BLOCK_LOOKBACK, 0)
      }

      const allTransferEvents = await this.getContract().getPastEvents('allEvents', {
        fromBlock: block,
        toBlock: currentBlock,
        topics: [constants.TRANSFER_TOPIC]
      })
      // Manually filter `to` parameter because `filter` option does not work with allEvents
      const events = allTransferEvents.filter(e => e.returnValues.to.toLowerCase() === address.toLowerCase())

      await events.map(async event =>
        this.core.addHistoryEvent({
          id: `${event.transactionHash}-${event.logIndex}`,
          asset: this.id,
          type: 'send',
          value: event.returnValues.value.toString(),
          from: event.returnValues.from,
          to: event.returnValues.to,
          tx: event.transactionHash,
          timestamp: await this._getBlockTimestamp(event.blockNumber)
        })
      )

      block = currentBlock
    }, this._pollInterval)
  }

  async getTx(txHash) {
    const historyEvents = this.core.getHistoryEvents({ asset: this.id })
    const eventMatch = historyEvents.filter(e => e.tx === txHash)
    if (eventMatch.length > 0) {
      return eventMatch[0]
    } else {
      return super.getTx(txHash)
    }
  }
}
