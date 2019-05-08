const fs = require('fs-extra');
const MetaMask = require('./MetaMask.js').MetaMask;
const MainPage = require('./mainPage.js').MainPage;

class User {
	constructor(driver, file) {
		try {
			this.driver = driver;
			let obj = JSON.parse(fs.readFileSync(file, "utf8"));
			this.account = obj.account;
			this.privateKey = obj.privateKey;
			this.networkID = obj.networkID;
			this.accountOrderInMetamask = "undefined";//for MetaMaskPage usage only
			this.name = file;
		}
		catch (err) {
			console.log("instance User was not created");
			console.log(err);
		}
	}

	async transferTokens(amount) {
		let mainPage = new MainPage(this.driver);
		let metaMask = new MetaMask(this.driver);
		return await mainPage.fillFieldAmount(amount) &&
			await mainPage.clickButtonTransfer() &&
			await mainPage.waitUntilShowUpButtonTransferConfirm() &&
			await mainPage.clickButtonTransferConfirm() &&
			await metaMask.signTransaction() &&
			await mainPage.waitUntilTransactionDone() &&
			await mainPage.waitUntilShowUpButtonOk() &&
			await mainPage.clickButtonOk()
	}

	async setMetaMaskNetwork() {
		let metaMask = new MetaMask(this.driver);
		return await  metaMask.switchToNextPage() &&
			await metaMask.setNetwork(this.networkID) &&
			await  metaMask.switchToNextPage();
	}

	async setMetaMaskAccount() {
		let metaMask = new MetaMask(this.driver);
		if (this.accountOrderInMetamask === "undefined") {
			return await metaMask.importAccount(this);
		} else
			return await metaMask.selectAccount(this);
	}
}

module.exports = {
	User: User
};
