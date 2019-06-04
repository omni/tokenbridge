const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs-extra');
const {user} = require('../e2e-commons/constants.json')
const config = require('./config.json')
const configFile = './config.json';

class Utils {

  static async getHomeAccount() {
    return {
      account: user.address,
      privateKey: user.privateKey,
      networkID: config.homeNetworkID
    }
  }

  static async getForeignAccount() {
    return {
      account: user.address,
      privateKey: user.privateKey,
      networkID: config.foreignNetworkID
    }
  }

  static async getStartURL() {
    return config.startUrl;
  }

  static async getErc20StartURL() {
    return config.erc20Url;
  }

  static async getErc20NativeStartURL() {
    return config.erc20NativeUrl;
  }

  static async startBrowserWithMetamask() {
    let source = './MetaMask.crx';
    let options = new chrome.Options();
    await options.addExtensions(source);
    await options.addArguments('disable-popup-blocking');
    let driver = await new webdriver.Builder().withCapabilities(options.toCapabilities()).build();
    await driver.sleep(5000);
    return driver;
  }
}

module.exports = {
  Utils
}
