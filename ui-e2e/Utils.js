const webdriver = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const {
  user,
  nativeToErcBridge,
  ercToErcBridge,
  ercToNativeBridge,
  homeRPC,
  foreignRPC
} = require('../e2e-commons/constants.json')

class Utils {
  static async getHomeAccount() {
    return {
      account: user.address,
      privateKey: user.privateKey,
      networkID: homeRPC.ID
    }
  }

  static async getForeignAccount() {
    return {
      account: user.address,
      privateKey: user.privateKey,
      networkID: foreignRPC.ID
    }
  }

  static async getStartURL() {
    return nativeToErcBridge.ui
  }

  static async getErc20StartURL() {
    return ercToErcBridge.ui
  }

  static async getErc20NativeStartURL() {
    return ercToNativeBridge.ui
  }

  static async startBrowserWithMetamask() {
    const source = './MetaMask.crx'
    const options = new chrome.Options()
    await options.addExtensions(source)
    await options.addArguments('disable-popup-blocking')
    const driver = await new webdriver.Builder().withCapabilities(options.toCapabilities()).build()
    await driver.sleep(5000)
    return driver
  }
}

module.exports = {
  Utils
}
