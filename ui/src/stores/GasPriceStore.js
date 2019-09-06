import { observable, computed } from 'mobx'
import { toHex } from 'web3-utils'
import { gasPriceFromOracle } from '../../../commons'

const {
  REACT_APP_COMMON_HOME_GAS_PRICE_FALLBACK,
  REACT_APP_COMMON_HOME_GAS_PRICE_SUPPLIER_URL,
  REACT_APP_COMMON_HOME_GAS_PRICE_SPEED_TYPE,
  REACT_APP_HOME_GAS_PRICE_UPDATE_INTERVAL,
  REACT_APP_COMMON_HOME_GAS_PRICE_FACTOR,
  REACT_APP_COMMON_FOREIGN_GAS_PRICE_FALLBACK,
  REACT_APP_COMMON_FOREIGN_GAS_PRICE_SUPPLIER_URL,
  REACT_APP_COMMON_FOREIGN_GAS_PRICE_SPEED_TYPE,
  REACT_APP_FOREIGN_GAS_PRICE_UPDATE_INTERVAL,
  REACT_APP_COMMON_FOREIGN_GAS_PRICE_FACTOR
} = process.env

const DEFAULT_GAS_PRICE_FACTOR = 1
const DEFAULT_GAS_PRICE_UPDATE_INTERVAL = 900000

class GasPriceStore {
  @observable
  gasPrice = null
  oracleUrl = null
  speedType = null
  updateInterval = null
  factor = null

  constructor(rootStore) {
    this.alertStore = rootStore.alertStore
    this.homeStore = rootStore.homeStore
    this.foreignStore = rootStore.foreignStore
    this.web3Store = rootStore.web3Store

    this.updateGasPrice()
  }

  async updateGasPrice() {
    await this.web3Store.setHomeWeb3Promise

    if (await this.web3Store.onHomeSide()) {
      this.gasPrice = REACT_APP_COMMON_HOME_GAS_PRICE_FALLBACK
      this.oracleUrl = REACT_APP_COMMON_HOME_GAS_PRICE_SUPPLIER_URL
      this.speedType = REACT_APP_COMMON_HOME_GAS_PRICE_SPEED_TYPE
      this.updateInterval = REACT_APP_HOME_GAS_PRICE_UPDATE_INTERVAL || DEFAULT_GAS_PRICE_UPDATE_INTERVAL
      this.factor = Number(REACT_APP_COMMON_HOME_GAS_PRICE_FACTOR) || DEFAULT_GAS_PRICE_FACTOR
    } else {
      this.gasPrice = REACT_APP_COMMON_FOREIGN_GAS_PRICE_FALLBACK
      this.oracleUrl = REACT_APP_COMMON_FOREIGN_GAS_PRICE_SUPPLIER_URL
      this.speedType = REACT_APP_COMMON_FOREIGN_GAS_PRICE_SPEED_TYPE
      this.updateInterval = REACT_APP_FOREIGN_GAS_PRICE_UPDATE_INTERVAL || DEFAULT_GAS_PRICE_UPDATE_INTERVAL
      this.factor = Number(REACT_APP_COMMON_FOREIGN_GAS_PRICE_FACTOR) || DEFAULT_GAS_PRICE_FACTOR
    }

    const oracleOptions = { speedType: this.speedType, factor: this.factor, logger: console }
    this.gasPrice = (await gasPriceFromOracle(() => fetch(this.oracleUrl), oracleOptions)) || this.gasPrice

    setTimeout(() => this.updateGasPrice(), this.updateInterval)
  }

  @computed
  get gasPriceInHex() {
    return toHex(this.gasPrice)
  }
}

export default GasPriceStore
