import { action, observable } from 'mobx'
import getWeb3, { getBalance, getWeb3Instance, getNetwork } from './utils/web3'
import { balanceLoaded } from './utils/testUtils'
import { BRIDGE_MODES } from './utils/bridgeMode'

class Web3Store {
  @observable
  injectedWeb3 = {}
  @observable
  defaultAccount = { address: '', homeBalance: '' }

  @observable
  homeWeb3 = {}
  @observable
  foreignWeb3 = {}

  @observable
  loading = true
  @observable
  errors = []

  @observable
  getWeb3Promise = null
  @observable
  setHomeWeb3Promise = null
  @observable
  metamaskNotSetted = false

  @observable
  homeNet = { id: '', name: '' }
  @observable
  foreignNet = { id: '', name: '' }
  @observable
  metamaskNet = { id: '', name: '' }

  @observable
  walletInstalled = true

  HOME_HTTP_PARITY_URL = process.env.REACT_APP_HOME_HTTP_PARITY_URL
  FOREIGN_HTTP_PARITY_URL = process.env.REACT_APP_FOREIGN_HTTP_PARITY_URL

  constructor(rootStore) {
    this.alertStore = rootStore.alertStore
    this.rootStore = rootStore

    this.getWeb3Promise = getWeb3()

    this.getWeb3Promise
      .then(web3Config => {
        this.setWeb3State(web3Config)
        this.getBalances(false)
        setInterval(() => {
          this.getBalances(true)
        }, 3000)
      })
      .catch(e => {
        const error = {
          rejected: () => this.alertStore.pushError(e.message),
          unlock: () => this.alertStore.pushError(e.message),
          install: () => (this.walletInstalled = false)
        }[e.type]

        console.error(e.message, 'web3 not loaded')
        this.errors.push(e.message)
        this.metamaskNotSetted = true
        error()
      })
    this.setWeb3Home()
    this.setWeb3Foreign()
    this.checkMetamaskConfig()
  }

  @action
  setWeb3State(web3Config) {
    const { web3Instance, defaultAccount, netIdName, netId } = web3Config
    this.metamaskNet = { id: netId, name: netIdName }
    this.defaultAccount.address = defaultAccount
    this.injectedWeb3 = web3Instance
    this.loading = false
  }

  @action
  async setWeb3Home() {
    this.homeWeb3 = getWeb3Instance(this.HOME_HTTP_PARITY_URL)
    this.setHomeWeb3Promise = getNetwork(this.homeWeb3).then(homeNet => {
      this.homeNet = homeNet
    })
  }

  @action
  async setWeb3Foreign() {
    this.foreignWeb3 = getWeb3Instance(this.FOREIGN_HTTP_PARITY_URL)
    this.foreignNet = await getNetwork(this.foreignWeb3)
  }

  @action
  async getBalances(displayLoading) {
    try {
      const accounts = await this.injectedWeb3.eth.getAccounts()
      const Loading = this.alertStore.showLoading
      let accountUpdated = false
      if (accounts[0] !== this.defaultAccount.address) {
        if (displayLoading && !Loading && accounts[0] !== undefined) {
          this.alertStore.setLoading(true)
          accountUpdated = true
        }
        this.defaultAccount.address = accounts[0]
      }
      this.defaultAccount.homeBalance = await getBalance(this.homeWeb3, this.defaultAccount.address)
      if (accountUpdated) {
        await this.rootStore.foreignStore.getTokenBalance()
        await this.rootStore.homeStore.getBalance()
        this.alertStore.setLoading(false)
      }
      if (
        this.rootStore.bridgeModeInitialized &&
        this.rootStore.bridgeMode !== BRIDGE_MODES.ERC_TO_ERC
      ) {
        balanceLoaded()
      }
    } catch (e) {
      console.error(e)
    }
  }

  @action
  checkMetamaskConfig() {
    if (!this.metamaskNotSetted) {
      if (this.metamaskNet.name === '' || this.homeNet.name === '' || this.foreignNet.name === '') {
        setTimeout(() => {
          this.checkMetamaskConfig()
        }, 1000)
        return
      }
      if (
        this.metamaskNet.name !== this.homeNet.name &&
        this.metamaskNet.name !== this.foreignNet.name
      ) {
        this.metamaskNotSetted = true
        this.alertStore.pushError(
          `You are on an unknown network on your wallet. Please select ${this.homeNet.name} or ${
            this.foreignNet.name
          } in order to communicate with the bridge.`
        )
      }
    }
  }

  async onHomeSide() {
    await this.getWeb3Promise
    await this.setHomeWeb3Promise
    return this.metamaskNet.id === this.homeNet.id
  }
}

export default Web3Store
