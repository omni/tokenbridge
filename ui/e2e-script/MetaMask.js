const key = require('selenium-webdriver').Key;
const Page = require('./Page.js').Page;
const By = require('selenium-webdriver/lib/by').By;
const IDMetaMask = "nkbihfbeogaeaoehlefnkodbefgpgknn";
const URL = "chrome-extension://" + IDMetaMask + "//popup.html";
const buttonSubmit = By.className("confirm btn-green");
const buttonAccept = By.xpath('//*[@id="app-content"]/div/div[4]/div/button');
const agreement = By.xpath("//*[@id=\"app-content\"]/div/div[4]/div/div/div/p[1]/strong");
const fieldNewPass = By.xpath("//*[@id=\"password-box\"]");
const fieldConfirmPass = By.xpath("//*[@id=\"password-box-confirm\"]");
const buttonCreate = By.xpath("//*[@id=\"app-content\"]/div/div[4]/div/button");
const buttonIveCopied = By.xpath("//*[@id=\"app-content\"]/div/div[4]/div/button[1]");
const popupNetwork = By.className("network-name");
const popupAccount = By.xpath("//*[@id=\"app-content\"]/div/div[1]/div/div[2]/span/div");
const fieldPrivateKey = By.xpath("//*[@id=\"private-key-box\"]");
const pass = "qwerty12345";
const buttonImport = By.xpath("//*[@id=\"app-content\"]/div/div[4]/div/div[3]/button");
const fieldNewRPCURL = By.id("new_rpc");
const buttonSave = By.xpath("//*[@id=\"app-content\"]/div/div[4]/div/div[3]/div/div[2]/button");
const arrowBackRPCURL = By.xpath("//*[@id=\"app-content\"]/div/div[4]/div/div[1]/i");
const iconChangeAccount = By.className("cursor-pointer color-orange accounts-selector");

var accountOrderNumber = 1;
var networks = [0, 3, 43, 4, 8545];

class MetaMask extends Page {

  constructor(driver) {
    super(driver);
    this.driver = driver;
    this.URL = URL;
  }

  async clickButtonSubmitTransaction() {
    return await this.clickWithWait(buttonSubmit);
  }

  async activate() {
    return await this.switchToNextPage() &&
      (await this.open(this.URL) === this.URL) &&
      await this.clickWithWait(buttonAccept) &&
      await this.clickWithWait(agreement) &&
      await this.clickKey(key.TAB, 15) &&
      await this.clickWithWait(buttonAccept) &&
      await this.waitUntilLocated(fieldNewPass) &&
      await this.clickWithWait(fieldNewPass) &&
      await this.fillWithWait(fieldNewPass, pass) &&
      await this.fillWithWait(fieldConfirmPass, pass) &&
      await this.clickWithWait(buttonCreate) &&
      await this.waitUntilDisplayed(buttonIveCopied) &&
      await this.clickWithWait(buttonIveCopied) &&
      await this.switchToNextPage();
  }

  async importAccount(user) {
    user.accountOrderInMetamask = accountOrderNumber - 1;
    return await  this.switchToNextPage() &&
      await  this.setNetwork(user.networkID) &&
      await  this.clickImportAccount() &&
      await  this.fillWithWait(fieldPrivateKey, user.privateKey) &&
      await  this.waitUntilDisplayed(buttonImport) &&
      await  this.clickWithWait(buttonImport) &&
      await  this.switchToNextPage();
  }

  async selectAccount(user) {
    try {
      await this.switchToNextPage();
      await this.setNetwork(user.networkID);
      await super.clickWithWait(popupAccount);
      await this.driver.executeScript("document.getElementsByClassName('dropdown-menu-item')[" +
        user.accountOrderInMetamask + "].click();");
      await this.switchToNextPage();
      return true;
    }
    catch (err) {
      return false;
    }
  }

  async clickImportAccount() {
    try {
      await super.clickWithWait(popupAccount);
      await this.driver.executeScript("document.getElementsByClassName('dropdown-menu-item')["
        + (accountOrderNumber + 1) + "].click();");
      accountOrderNumber++;
      return true;
    }
    catch (err) {
      return false;
    }
  }

  async signTransaction(refreshCount) {
    await this.switchToNextPage();
    let counter = 5;
    if (refreshCount !== undefined) counter = refreshCount;
    do {
      await this.refresh();
      await super.waitUntilLocated(iconChangeAccount);
      if (await this.isElementDisplayed(buttonSubmit)) {
        return await this.clickButtonSubmitTransaction() &&
          await  this.switchToNextPage();
      }
      await this.driver.sleep(3000);
    } while (counter-- >= 0);

    await this.switchToNextPage();
    return false;
  }

  async setNetwork(provider) {
    try {
      await super.clickWithWait(popupNetwork);
      let orderNumber = networks.indexOf(provider);
      let script = "document.getElementsByClassName('dropdown-menu-item')[" + orderNumber + "].click();"
      if (orderNumber < 0) await this.addNetwork(provider);
      else await this.driver.executeScript(script);
      return true;
    }
    catch (err) {
      return false;
    }
  }

  async addNetwork(provider) {
    let url;
    switch (provider) {
      case 77: {
        url = "http://10.1.0.102:8545";
        networks.push(177);
        break;
      }
      case 42: {
        url = "http://10.1.0.103:8545";
        networks.push(142);
        break;
      }
    }
    const index = networks.length > 8 ? 8 : networks.length;
    await this.driver.executeScript("document.getElementsByClassName('dropdown-menu-item')[" +
      (index - 1) + "].click();");
    return await super.fillWithWait(fieldNewRPCURL, url) &&
      await super.clickWithWait(buttonSave) &&
      await super.clickWithWait(arrowBackRPCURL);
  }
}

module.exports = {
  MetaMask: MetaMask
};
