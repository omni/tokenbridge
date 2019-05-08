const webdriver = require('selenium-webdriver'),
  chrome = require('selenium-webdriver/chrome');
const fs = require('fs-extra');
const configFile = './e2e-script/config.json';

class Utils {

  static async getHomeAccount() {
    try {
      let obj = JSON.parse(fs.readFileSync(configFile), "utf8");
      return obj.homeAccount;
    } catch (err) {
      return null;
    }
  }

  static async getForeignAccount() {
    try {
      let obj = JSON.parse(fs.readFileSync(configFile), "utf8");
      return obj.foreignAccount;
    } catch (err) {
      return null;
    }
  }

  static async getStartURL() {
    try {
      let obj = JSON.parse(fs.readFileSync(configFile), "utf8");
      return obj.startUrl;
    } catch (err) {
      return null;
    }
  }

  static async getErc20StartURL() {
    try {
      let obj = JSON.parse(fs.readFileSync(configFile), "utf8");
      return obj.erc20Url;
    } catch (err) {
      return null;
    }
  }

  static async getErc20NativeStartURL() {
    try {
      let obj = JSON.parse(fs.readFileSync(configFile), "utf8");
      return obj.erc20NativeUrl;
    } catch (err) {
      return null;
    }
  }

  static async startBrowserWithMetamask() {
    let source = './e2e-script/MetaMask.crx';
    let options = new chrome.Options();
    await options.addExtensions(source);
    await options.addArguments('disable-popup-blocking');
    let driver = await new webdriver.Builder().withCapabilities(options.toCapabilities()).build();
    await driver.sleep(5000);
    return driver;
  }

}

module.exports = {
  Utils: Utils
}

