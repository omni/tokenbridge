const Page = require('./Page.js').Page;
const By = require('selenium-webdriver/lib/by').By;
const fieldAmount = By.id("amount");
const buttonTransfer = By.className("bridge-form-button ");
const buttonOk = By.className("swal-button swal-button--confirm");
const fieldsBalance = By.className("network-balance");
const classWeb3Loaded = By.className("web3-loaded");
const classPendingTransaction = By.className("pending-transaction");
const loadingContainer = By.className("loading-container");
const buttonTransferConfirm = By.className("transfer-confirm");
const buttonDisclaimerConfirm = By.className("disclaimer-confirm");
const checkboxDisclaimer = By.className("disclaimer-checkbox");
const disclaimer = By.className("disclaimer-title");

class MainPage extends Page {
	constructor(driver) {
		super(driver);
		this.url;
		this.fieldHomePOABalance;
		this.fieldForeignPOABalance;
	}

	async initFieldsBalance() {
		if (!(await this.waitUntilWeb3Loaded())) return null;
		try {
			let array;
			array = await super.findWithWait(fieldsBalance);
			this.fieldHomePOABalance = array[0];
			this.fieldForeignPOABalance = array[1];
			return array;
		}
		catch (err) {
			return null;
		}
	}

	async getHomePOABalance() {
		await this.initFieldsBalance();
		return parseFloat(await  this.fieldHomePOABalance.getText());
	}

	async getForeignPOABalance() {
		await this.initFieldsBalance();
		return parseFloat(await  this.fieldForeignPOABalance.getText());
	}

	async fillFieldAmount(amount) {
		try {
			await this.clickWithWait(fieldAmount);
			await this.fillWithWait(fieldAmount, amount);
			return true;
		}
		catch (err) {
			return false;
		}
	}

	async clickButtonTransfer() {
		return await this.clickWithWait(buttonTransfer);
	}

	async clickButtonOk() {
		return await super.clickWithWait(buttonOk);
	}

	async clickButtonTransferConfirm() {
		return await super.clickWithWait(buttonTransferConfirm);
	}

	async isPresentButtonOk() {
		return await super.isElementDisplayed(buttonOk, 180);
	}

	async waitUntilWeb3Loaded() {
		return await this.waitUntilLocated(classWeb3Loaded, 180);
	}

	async isPendingTransaction() {
		return await super.isElementLocated(classPendingTransaction);
	}

	async waitUntilTransactionDone() {
		return await this.waitUntilDisappear(classPendingTransaction, 360);
	}

	async waitUntilShowUpButtonOk() {
		return await super.waitUntilDisplayed(buttonOk, 360);
	}

	async waitUntilShowUpButtonTransferConfirm() {
		return await super.waitUntilDisplayed(buttonTransferConfirm, 360);
	}

	async waitUntilShowUpButtonOk() {
		return await super.waitUntilDisplayed(buttonOk, 360);
	}

	async waitUntilShowUpLoadingContainer() {
		return await super.waitUntilDisplayed(loadingContainer, 180);
	}

	async isDisplayedLoadingContainer() {
		return await super.isElementDisplayed(loadingContainer);
	}

	async confirmDisclaimer() {
		return await super.waitUntilDisplayed(disclaimer, 180) &&
			//await this.clickCheckboxDisclaimer() &&
			await this.clickButtonDisclaimerConfirm();
	}

	async clickButtonDisclaimerConfirm() {
		return await super.clickWithWait(buttonDisclaimerConfirm);
	}

	async clickCheckboxDisclaimer() {
		return await super.clickWithWait(checkboxDisclaimer);
	}

	async open(url) {
		let counter = 60;
		do {
			await this.driver.sleep(1000);
			await super.open(url);
		} while (counter-- >= 0 && !await this.isElementDisplayed(disclaimer))
		return (counter >= 0);
	}

}

module.exports = {
	MainPage: MainPage
};
