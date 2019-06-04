import { action } from 'mobx'
import Web3Store from './Web3Store'
import HomeStore from './HomeStore'
import ForeignStore from './ForeignStore'
import AlertStore from './AlertStore'
import GasPriceStore from './GasPriceStore'
import TxStore from './TxStore'
import { abi as HOME_ERC_ABI } from '../../../contracts/build/contracts/HomeBridgeErcToErc'
import { decodeBridgeMode } from './utils/bridgeMode'
import { getWeb3Instance } from './utils/web3'

class RootStore {
  constructor() {
    this.bridgeModeInitialized = false
    this.setBridgeMode()
    this.alertStore = new AlertStore()
    this.web3Store = new Web3Store(this)
    this.homeStore = new HomeStore(this)
    this.foreignStore = new ForeignStore(this)
    this.gasPriceStore = new GasPriceStore(this)
    this.txStore = new TxStore(this)
  }

  @action
  async setBridgeMode() {
    const homeWeb3 = getWeb3Instance(process.env.REACT_APP_HOME_HTTP_PARITY_URL)
    const homeBridge = new homeWeb3.eth.Contract(
      HOME_ERC_ABI,
      process.env.REACT_APP_HOME_BRIDGE_ADDRESS
    )
    const bridgeModeHash = await homeBridge.methods.getBridgeMode().call()
    this.bridgeMode = decodeBridgeMode(bridgeModeHash)
    this.bridgeModeInitialized = true
  }
}

export default new RootStore()
