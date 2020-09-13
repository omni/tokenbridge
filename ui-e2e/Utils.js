const webdriver = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const {
  user,
  nativeToErcBridge,
  ercToErcBridge,
  ercToNativeBridge,
  ambStakeErcToErc,
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

  static async getAMBStakeStartURL() {
    return ambStakeErcToErc.ui
  }

  static async startBrowserWithMetamask() {
    const source = './MetaMask.crx'
    const options = new chrome.Options()
    await options.addArguments('--no-sandbox')
    await options.addArguments('--disable-gpu')
    await options.addArguments('--disable-dev-shm-usage')
    await options.addArguments('disable-popup-blocking')
    await options.addExtensions(source)
    const driver = await new webdriver.Builder().withCapabilities(options.toCapabilities()).build()
    await driver.sleep(5000)
    return driver
  }
}

module.exports = {
  Utils
}
