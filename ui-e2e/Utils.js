const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs-extra');
const {user} = require('../e2e-commons/constants.json')
const config = require('./config.json')
const configFile = './config.json';

class Utils {

  static async getHomeAccount() {
    try {
      return {
        account: user.address,
        privateKey: user.privateKey,
        networkID: config.homeNetworkID
      }
      return config.homeAccount;
    } catch (err) {
      return null;
    }
  }

  static async getForeignAccount() {
    try {
      return {
        account: user.address,
        privateKey: user.privateKey,
        networkID: config.foreignNetworkID
      }
    } catch (err) {
      return null;
    }
  }

  static async getStartURL() {
    try {
      return config.startUrl;
    } catch (err) {
      return null;
    }
  }

  static async getErc20StartURL() {
    try {
      return config.erc20Url;
    } catch (err) {
      return null;
    }
  }

  static async getErc20NativeStartURL() {
    try {
      return config.erc20NativeUrl;
    } catch (err) {
      return null;
    }
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
