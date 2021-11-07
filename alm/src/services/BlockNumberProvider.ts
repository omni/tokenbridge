import Web3 from 'web3'
import differenceInMilliseconds from 'date-fns/differenceInMilliseconds'
import { FOREIGN_RPC_POLLING_INTERVAL, HOME_RPC_POLLING_INTERVAL } from '../config/constants'

export class BlockNumberProvider {
  private running: number
  private web3: Maybe<Web3>
  private ref: number | undefined
  private value: Maybe<number>
  private lastValueTimestamp: Maybe<Date>
  private readonly interval: number

  constructor(interval = 5000) {
    this.running = 0
    this.web3 = null
    this.ref = undefined
    this.value = null
    this.lastValueTimestamp = null
    this.interval = interval

    return this
  }

  start(web3: Maybe<Web3>) {
    if (!this.running) {
      clearTimeout(this.ref)
      this.web3 = web3
      this.running = this.running + 1
      this.fetchLastBlock()
    } else {
      this.running = this.running + 1
    }
  }

  stop() {
    this.running = this.running > 0 ? this.running - 1 : 0

    if (!this.running) {
      clearTimeout(this.ref)
      this.ref = undefined
      this.web3 = null
    }
  }

  get() {
    return this.value
  }

  private async fetchLastBlock() {
    if (!this.web3) return
    const now = new Date()
    const distance = differenceInMilliseconds(now, this.lastValueTimestamp || 0)

    if (distance >= this.interval) {
      this.value = await this.web3.eth.getBlockNumber()
      this.lastValueTimestamp = now
    }

    this.ref = setTimeout(() => this.fetchLastBlock(), this.interval)
  }
}

export const homeBlockNumberProvider = new BlockNumberProvider(HOME_RPC_POLLING_INTERVAL)
export const foreignBlockNumberProvider = new BlockNumberProvider(FOREIGN_RPC_POLLING_INTERVAL)
