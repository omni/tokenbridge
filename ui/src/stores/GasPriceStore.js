import { observable, computed } from 'mobx'
import { toHex } from 'web3-utils'
import { fetchGasPrice, fetchGasPriceFromOracle } from './utils/gas'

const HOME_GAS_PRICE_FALLBACK = process.env.REACT_APP_HOME_GAS_PRICE_FALLBACK
const HOME_GAS_PRICE_ORACLE_URL = process.env.REACT_APP_HOME_GAS_PRICE_ORACLE_URL
const HOME_GAS_PRICE_SPEED_TYPE = process.env.REACT_APP_HOME_GAS_PRICE_SPEED_TYPE
const HOME_GAS_PRICE_UPDATE_INTERVAL = process.env.REACT_APP_HOME_GAS_PRICE_UPDATE_INTERVAL
const FOREIGN_GAS_PRICE_FALLBACK = process.env.REACT_APP_FOREIGN_GAS_PRICE_FALLBACK
const FOREIGN_GAS_PRICE_ORACLE_URL = process.env.REACT_APP_FOREIGN_GAS_PRICE_ORACLE_URL
const FOREIGN_GAS_PRICE_SPEED_TYPE = process.env.REACT_APP_FOREIGN_GAS_PRICE_SPEED_TYPE
const FOREIGN_GAS_PRICE_UPDATE_INTERVAL = process.env.REACT_APP_FOREIGN_GAS_PRICE_UPDATE_INTERVAL

class GasPriceStore {
  @observable
  gasPrice = null

  oracleUrl = null
  speedType = null
  updateInterval = null
  bridgeContract = null

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
      this.gasPrice = HOME_GAS_PRICE_FALLBACK
      this.oracleUrl = HOME_GAS_PRICE_ORACLE_URL
      this.speedType = HOME_GAS_PRICE_SPEED_TYPE
      this.updateInterval = HOME_GAS_PRICE_UPDATE_INTERVAL || 900000
      this.bridgeContract = this.homeStore.homeBridge
    } else {
      this.gasPrice = FOREIGN_GAS_PRICE_FALLBACK
      this.oracleUrl = FOREIGN_GAS_PRICE_ORACLE_URL
      this.speedType = FOREIGN_GAS_PRICE_SPEED_TYPE
      this.updateInterval = FOREIGN_GAS_PRICE_UPDATE_INTERVAL || 900000
      this.bridgeContract = this.foreignStore.foreignBridge
    }

    const newGasPrice = await fetchGasPrice({
      bridgeContract: this.bridgeContract,
      oracleFn: () => fetchGasPriceFromOracle(this.oracleUrl, this.speedType)
    })

    this.gasPrice = newGasPrice || this.gasPrice
    setTimeout(() => this.updateGasPrice(), this.updateInterval)
  }

  @computed
  get gasPriceInHex() {
    return toHex(this.gasPrice)
  }
}

export default GasPriceStore
