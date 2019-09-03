import { observable, computed } from 'mobx'
import { toHex } from 'web3-utils'
import { gasPriceFromOracle } from '../../../commons'

const COMMON_HOME_GAS_PRICE_FALLBACK = process.env.COMMON_HOME_GAS_PRICE_FALLBACK
const COMMON_HOME_GAS_PRICE_SUPPLIER_URL = process.env.COMMON_HOME_GAS_PRICE_SUPPLIER_URL
const COMMON_HOME_GAS_PRICE_SPEED_TYPE = process.env.COMMON_HOME_GAS_PRICE_SPEED_TYPE
const ORACLE_HOME_GAS_PRICE_UPDATE_INTERVAL = process.env.UI_HOME_GAS_PRICE_UPDATE_INTERVAL
const COMMON_HOME_GAS_PRICE_FACTOR = process.env.COMMON_HOME_GAS_PRICE_FACTOR
const COMMON_FOREIGN_GAS_PRICE_FALLBACK = process.env.COMMON_FOREIGN_GAS_PRICE_FALLBACK
const COMMON_FOREIGN_GAS_PRICE_SUPPLIER_URL = process.env.COMMON_FOREIGN_GAS_PRICE_SUPPLIER_URL
const COMMON_FOREIGN_GAS_PRICE_SPEED_TYPE = process.env.COMMON_FOREIGN_GAS_PRICE_SPEED_TYPE
const ORACLE_FOREIGN_GAS_PRICE_UPDATE_INTERVAL = process.env.UI_FOREIGN_GAS_PRICE_UPDATE_INTERVAL
const COMMON_FOREIGN_GAS_PRICE_FACTOR = process.env.COMMON_FOREIGN_GAS_PRICE_FACTOR

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
      this.gasPrice = COMMON_HOME_GAS_PRICE_FALLBACK
      this.oracleUrl = COMMON_HOME_GAS_PRICE_SUPPLIER_URL
      this.speedType = COMMON_HOME_GAS_PRICE_SPEED_TYPE
      this.updateInterval = ORACLE_HOME_GAS_PRICE_UPDATE_INTERVAL || DEFAULT_GAS_PRICE_UPDATE_INTERVAL
      this.factor = Number(COMMON_HOME_GAS_PRICE_FACTOR) || DEFAULT_GAS_PRICE_FACTOR
    } else {
      this.gasPrice = COMMON_FOREIGN_GAS_PRICE_FALLBACK
      this.oracleUrl = COMMON_FOREIGN_GAS_PRICE_SUPPLIER_URL
      this.speedType = COMMON_FOREIGN_GAS_PRICE_SPEED_TYPE
      this.updateInterval = ORACLE_FOREIGN_GAS_PRICE_UPDATE_INTERVAL || DEFAULT_GAS_PRICE_UPDATE_INTERVAL
      this.factor = Number(COMMON_FOREIGN_GAS_PRICE_FACTOR) || DEFAULT_GAS_PRICE_FACTOR
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
