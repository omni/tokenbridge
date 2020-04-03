import { ERC20Asset } from '@burner-wallet/assets'
import { ERC677_ABI } from '../../../../commons'

export default class ERC677Asset extends ERC20Asset {
  constructor({ abi = ERC677_ABI, ...params }) {
    // @ts-ignore
    super({ abi, type: 'erc677', ...params })
  }

  // @ts-ignore
  async _send({ from, to, value }) {
    // @ts-ignore
    const receipt = await this.getContract()
      .methods.transferAndCall(to, value, '0x')
      .send({ from })
    return {
      ...receipt,
      txHash: receipt.transactionHash,
      id: `${receipt.transactionHash}-${receipt.events.Transfer.logIndex}`
    }
  }
}
