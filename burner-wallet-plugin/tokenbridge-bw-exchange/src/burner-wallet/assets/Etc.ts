import NativeMediatorAsset from './NativeMediatorAsset'
import { isVanillaBridgeContract, HOME_NATIVE_TO_ERC_ABI } from '../../utils'

class EtcNativeAsset extends NativeMediatorAsset {
  constructor(props) {
    super({ mediatorAddress: '0x073081832B4Ecdce79d4D6753565c85Ba4b3BeA9', ...props })
  }

  async scanMediatorEvents(address, fromBlock, toBlock) {
    const web3 = this.getWeb3()
    const contract = new web3.eth.Contract(HOME_NATIVE_TO_ERC_ABI, this.mediatorAddress)
    const listenToBridgeEvent = await isVanillaBridgeContract(contract)
    if (listenToBridgeEvent && this.mediatorAddress != '') {
      const events = await contract.getPastEvents('AffirmationCompleted', {
        fromBlock,
        toBlock
      })
      const filteredEvents = events.filter(
        event => event.returnValues.recipient.toLowerCase() === address.toLowerCase()
      )

      for (const event of filteredEvents) {
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
    } else {
      await super.scanMediatorEvents(address, fromBlock, toBlock)
    }
  }
}

export default new EtcNativeAsset({
  id: 'etc',
  name: 'ETC',
  network: '61',
  icon: 'https://user-images.githubusercontent.com/4614574/77648741-666cf800-6f47-11ea-8cb4-01b9db00c264.png'
})
