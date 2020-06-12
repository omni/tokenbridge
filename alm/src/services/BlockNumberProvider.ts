import Web3 from 'web3'

export class BlockNumberProvider {
  private running: boolean
  private web3: Maybe<Web3>
  private ref: number | undefined
  private value: Maybe<number>
  private interval: number

  constructor() {
    this.running = false
    this.web3 = null
    this.ref = undefined
    this.value = null
    this.interval = 5000
  }

  start(web3: Maybe<Web3>, interval: number) {
    if (web3 && !this.running) {
      clearTimeout(this.ref)
      this.web3 = web3
      this.interval = interval
      this.running = true
      this.fetchLastBlock()
    }
  }

  stop() {
    clearTimeout(this.ref)
    this.running = false
    this.ref = undefined
    this.value = null
  }

  get() {
    return this.value
  }

  private async fetchLastBlock() {
    if (!this.web3) return
    this.value = await this.web3.eth.getBlockNumber()
    this.ref = setTimeout(() => this.fetchLastBlock(), this.interval)
  }
}
