import { NativeAsset } from '@burner-wallet/assets'
import { HOME_NATIVE_TO_ERC_ABI } from '../../../../../commons'

class EtcNativeAsset extends NativeAsset {
  protected bridgeAddress: string

  constructor(props) {
    super(props)
    this.bridgeAddress = '0x073081832B4Ecdce79d4D6753565c85Ba4b3BeA9'
  }

  async scanBlocks(address, fromBlock, toBlock) {
    await super.scanBlocks(address, fromBlock, toBlock)

    const web3 = this.getWeb3()
    const contract = new web3.eth.Contract(HOME_NATIVE_TO_ERC_ABI, this.bridgeAddress)
    const events = await contract.getPastEvents('AffirmationCompleted', {
      fromBlock,
      toBlock
    })
    const filteredEvents = events.filter(event => event.returnValues.recipient.toLowerCase() === address.toLowerCase())

    for (const event of filteredEvents) {
      this.core.addHistoryEvent({
        id: `${event.transactionHash}-${event.logIndex}`,
        asset: this.id,
        type: 'send',
        value: event.returnValues.value.toString(),
        from: this.bridgeAddress,
        to: event.returnValues.recipient,
        tx: event.transactionHash,
        timestamp: await this._getBlockTimestamp(event.blockNumber)
      })
    }
  }

  async getTx(txHash) {
    const historyEvents = this.core.getHistoryEvents({ asset: this.id, account: this.bridgeAddress })
    const eventMatch = historyEvents.filter(e => e.tx === txHash)
    if (eventMatch.length > 0) {
      return eventMatch[0]
    } else {
      return super.getTx(txHash)
    }
  }
}

export default new EtcNativeAsset({
  id: 'etc',
  name: 'ETC',
  network: '61',
  icon: 'https://user-images.githubusercontent.com/4614574/77648741-666cf800-6f47-11ea-8cb4-01b9db00c264.png'
})
