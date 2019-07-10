/* eslint-disable no-return-await */
const { By } = require('selenium-webdriver/lib/by')
const { Page } = require('./Page.js')

const fieldAmount = By.id('amount')
const buttonTransfer = By.className('bridge-form-button ')
const buttonOk = By.className('swal-button swal-button--confirm')
const fieldsBalance = By.className('network-balance')
const classWeb3Loaded = By.className('web3-loaded')
const classPendingTransaction = By.className('pending-transaction')
const loadingContainer = By.className('loading-container')
const buttonTransferConfirm = By.className('transfer-confirm')
const buttonDisclaimerConfirm = By.className('disclaimer-confirm')
const checkboxDisclaimer = By.className('disclaimer-checkbox')
const disclaimer = By.className('disclaimer-title')

class MainPage extends Page {
  async initFieldsBalance() {
    if (!(await this.waitUntilWeb3Loaded())) return null
    try {
      const array = await super.findWithWait(fieldsBalance)
      /* eslint-disable prefer-destructuring */
      this.fieldHomePOABalance = array[0]
      this.fieldForeignPOABalance = array[1]
      /* eslint-enable prefer-destructuring */
      return array
    } catch (err) {
      return null
    }
  }

  async getHomePOABalance() {
    await this.initFieldsBalance()
    return parseFloat(await this.fieldHomePOABalance.getText())
  }

  async getForeignPOABalance() {
    await this.initFieldsBalance()
    return parseFloat(await this.fieldForeignPOABalance.getText())
  }

  async fillFieldAmount(amount) {
    try {
      await this.clickWithWait(fieldAmount)
      await this.fillWithWait(fieldAmount, amount)
      return true
    } catch (err) {
      return false
    }
  }

  async clickButtonTransfer() {
    return this.clickWithWait(buttonTransfer)
  }

  async clickButtonOk() {
    return super.clickWithWait(buttonOk)
  }

  async clickButtonTransferConfirm() {
    return super.clickWithWait(buttonTransferConfirm)
  }

  async isPresentButtonOk() {
    return super.isElementDisplayed(buttonOk, 180)
  }

  async waitUntilWeb3Loaded() {
    return this.waitUntilLocated(classWeb3Loaded, 180)
  }

  async isPendingTransaction() {
    return super.isElementLocated(classPendingTransaction)
  }

  async waitUntilTransactionDone() {
    return this.waitUntilDisappear(classPendingTransaction, 360)
  }

  async waitUntilShowUpButtonOk() {
    return super.waitUntilDisplayed(buttonOk, 360)
  }

  async waitUntilShowUpButtonTransferConfirm() {
    return super.waitUntilDisplayed(buttonTransferConfirm, 360)
  }

  async waitUntilShowUpLoadingContainer() {
    return super.waitUntilDisplayed(loadingContainer, 180)
  }

  async isDisplayedLoadingContainer() {
    return super.isElementDisplayed(loadingContainer)
  }

  async confirmDisclaimer() {
    return (
      (await super.waitUntilDisplayed(disclaimer, 180)) &&
      // await this.clickCheckboxDisclaimer() &&
      (await this.clickButtonDisclaimerConfirm())
    )
  }

  async clickButtonDisclaimerConfirm() {
    return super.clickWithWait(buttonDisclaimerConfirm)
  }

  async clickCheckboxDisclaimer() {
    return super.clickWithWait(checkboxDisclaimer)
  }

  async open(url) {
    let counter = 60
    do {
      await this.driver.sleep(1000)
      await super.open(url)
    } while (counter-- >= 0 && !(await this.isElementDisplayed(disclaimer)))
    return counter >= 0
  }
}

module.exports = {
  MainPage
}
