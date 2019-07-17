const { MetaMask } = require('./MetaMask.js')
const { MainPage } = require('./mainPage.js')

class User {
  constructor(driver, obj) {
    try {
      this.driver = driver
      this.account = obj.account
      this.privateKey = obj.privateKey
      this.networkID = obj.networkID
      this.accountOrderInMetamask = 'undefined' // for MetaMaskPage usage only
    } catch (err) {
      console.log('instance User was not created')
      console.log(err)
    }
  }

  async transferTokens(amount) {
    const mainPage = new MainPage(this.driver)
    const metaMask = new MetaMask(this.driver)
    return (
      (await mainPage.fillFieldAmount(amount)) &&
      (await mainPage.clickButtonTransfer()) &&
      (await mainPage.waitUntilShowUpButtonTransferConfirm()) &&
      (await mainPage.clickButtonTransferConfirm()) &&
      (await metaMask.signTransaction()) &&
      (await mainPage.waitUntilTransactionDone()) &&
      (await mainPage.waitUntilShowUpButtonOk()) &&
      (await mainPage.clickButtonOk())
    )
  }

  async setMetaMaskNetwork() {
    const metaMask = new MetaMask(this.driver)
    return (
      (await metaMask.switchToNextPage()) &&
      (await metaMask.setNetwork(this.networkID)) &&
      (await metaMask.switchToNextPage())
    )
  }

  async setMetaMaskAccount() {
    const metaMask = new MetaMask(this.driver)
    if (this.accountOrderInMetamask === 'undefined') {
      return await metaMask.importAccount(this)
    } else return await metaMask.selectAccount(this)
  }
}

module.exports = {
  User
}
