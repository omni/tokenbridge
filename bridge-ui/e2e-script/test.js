let test = require('selenium-webdriver/testing');
let assert = require('assert');
const Utils = require('./Utils.js').Utils;
const MetaMask = require('./MetaMask.js').MetaMask;
const MainPage = require('./mainPage.js').MainPage;
const User = require("./User.js").User;

test.describe('e2e-test for bridge.poa, version 1.5.0', async function () {
	this.timeout(5 * 60000);
	this.slow(1 * 60000);

	const maxAmountPerTransactionLimit = 1;
	let startURL;
	let driver;
	let mainPage;
	let homeAccount;
	let foreignAccount;
	let metaMask;
	let foreignBalanceBefore;
	let homeBalanceBefore;

	test.before(async function () {
		try {
			driver = await Utils.startBrowserWithMetamask();
			mainPage = new MainPage(driver);
			homeAccount = new User(driver, await Utils.getHomeAccount());
			foreignAccount = new User(driver, await Utils.getForeignAccount());
			metaMask = new MetaMask(driver);
			await metaMask.activate();
			await homeAccount.setMetaMaskAccount();
    } catch (e) {
      console.log(e)
    }
	});

  test.after(async function () {
    try {
      await driver.quit();
    } catch (e) {
      console.log(e)
    }
  });

	test.it('User is able to open main page of bridge-ui  ',
		async function () {
			startURL = await Utils.getStartURL();
			let result = await  mainPage.open(startURL);
			console.log("Test URL:  " + startURL);
			return await assert.equal(result, true, "Test FAILED. Build failed.");
		});

	test.it('Home page: disclaimer is displayed  ',
		async function () {
			let result = await  mainPage.confirmDisclaimer();
			return await assert.equal(result, true, "Test FAILED. Disclaimer is not displayed");
		});

	test.it('Main page: foreign POA balance is displayed ',
		async function () {
			foreignBalanceBefore = await mainPage.getForeignPOABalance();
			console.log("foreignBalanceBefore = "+foreignBalanceBefore);
			let result = foreignBalanceBefore === 0;
			return await assert.equal(result, true, "Test FAILED.Foreign POA balance is zero or not displayed ");
		});

	test.it('Main page: home POA balance is displayed ',
		async function () {
			homeBalanceBefore = await mainPage.getHomePOABalance();
			console.log("homeBalanceBefore = "+homeBalanceBefore);
			let result = homeBalanceBefore !== 0;
			return await assert.equal(result, true, "Test FAILED.Home POA balance is zero or not displayed ");
		});

	test.it('User is able to send tokens from Home account to Foreign account ',
		async function () {
			let result = await homeAccount.transferTokens(maxAmountPerTransactionLimit);
			return await assert.equal(result, true, "Test FAILED. User is able send tokens from Home account to Foreign account");
		});

	test.it('Home POA balance has correctly changed after transaction',
		async function () {
			let newHomeBalance = await mainPage.getHomePOABalance();
			let shouldBe = homeBalanceBefore - maxAmountPerTransactionLimit;
			console.log("newHomeBalance = " + newHomeBalance);
			console.log("shouldBe = " + shouldBe);
			let result = (Math.abs(shouldBe - newHomeBalance)) < (maxAmountPerTransactionLimit / 100);
			homeBalanceBefore = newHomeBalance;
			return await assert.equal(result, true, "Test FAILED.Home POA balance is not correct after transaction");
		});

	test.it('Foreign account has received correct amount of tokens after transaction ',
		async function () {
			let newForeignBalance = await mainPage.getForeignPOABalance();

			let shouldBe = foreignBalanceBefore + maxAmountPerTransactionLimit;
			console.log("newForeignBalance = " + newForeignBalance);
			console.log("shouldBe = " + shouldBe);

			let result = (Math.abs(shouldBe - newForeignBalance)) < (maxAmountPerTransactionLimit / 100);
			return await assert.equal(result, true, "Test FAILED. Foreign POA balance is not correct after transaction");
		});

	test.it('User is able to send tokens from Foreign account to Home account ',
		async function () {
			await foreignAccount.setMetaMaskNetwork();
			foreignBalanceBefore = await mainPage.getHomePOABalance();
			let result = await foreignAccount.transferTokens(maxAmountPerTransactionLimit);
			return await assert.equal(result, true, "Test FAILED. User is able send tokens from Home account to Foreign account");
		});

	test.it('Foreign POA balance has correctly changed after transaction',
		async function () {
			let newForeignBalance = await mainPage.getHomePOABalance();
			let shouldBe = foreignBalanceBefore - maxAmountPerTransactionLimit;
			console.log("newForeignBalance = " + newForeignBalance);
			console.log("shouldBe = " + shouldBe);
			let result = (Math.abs(shouldBe - newForeignBalance)) < (maxAmountPerTransactionLimit / 100);
			return await assert.equal(result, true, "Test FAILED.Foreign POA balance is not correct after transaction");
		});

	test.it('Home account has received correct amount of tokens after transaction ',
		async function () {
			let newHomeBalance = await mainPage.getForeignPOABalance();
			let shouldBe = homeBalanceBefore + maxAmountPerTransactionLimit;
			console.log("newHomeBalance = " + newHomeBalance);
			console.log("shouldBe = " + shouldBe);
			let result = (Math.abs(shouldBe - newHomeBalance)) < (maxAmountPerTransactionLimit / 100);
			return await assert.equal(result, true, "Test FAILED.Home POA balance is not correct after transaction");
		});

  test.it('ERC20-ERC20 - User is able to open main page of bridge-ui  ',
    async function () {
      startURL = await Utils.getErc20StartURL();
      let result = await  mainPage.open(startURL);
      console.log("Test URL:  " + startURL);
      return await assert.equal(result, true, "Test FAILED. Build failed.");
    });

  test.it('ERC20-ERC20 - Home page: disclaimer is displayed  ',
    async function () {
      let result = await  mainPage.confirmDisclaimer();
      return await assert.equal(result, true, "Test FAILED. Disclaimer is not displayed");
    });

  test.it('ERC20-ERC20 - Main page: foreign erc20 balance is displayed ',
    async function () {
      foreignBalanceBefore = await mainPage.getForeignPOABalance();
      console.log("foreignBalanceBefore = "+foreignBalanceBefore);
      let result = foreignBalanceBefore === 0;
      return await assert.equal(result, true, "Test FAILED. Foreign erc20 balance is not zero");
    });

  test.it('ERC20-ERC20 - Main page: home erc20 balance is displayed ',
    async function () {
      homeBalanceBefore = await mainPage.getHomePOABalance();
      console.log("homeBalanceBefore = "+homeBalanceBefore);
      let result = homeBalanceBefore !== 0;
      return await assert.equal(result, true, "Test FAILED. Home erc20 balance is zero or not displayed ");
    });

  test.it('ERC20-ERC20 - User is able to send tokens from Foreign account to Home account ',
    async function () {
      homeBalanceBefore = await mainPage.getForeignPOABalance();
      foreignBalanceBefore = await mainPage.getHomePOABalance();
      let result = await foreignAccount.transferTokens(maxAmountPerTransactionLimit);
      return await assert.equal(result, true, "Test FAILED. User is able send tokens from Foreign account to Home account");
    });

  test.it('ERC20-ERC20 - Foreign POA balance has correctly changed after transaction',
    async function () {
      let newForeignBalance = await mainPage.getHomePOABalance();
      let shouldBe = foreignBalanceBefore - maxAmountPerTransactionLimit;
      console.log("newForeignBalance = " + newForeignBalance);
      console.log("shouldBe = " + shouldBe);
      let result = (Math.abs(shouldBe - newForeignBalance)) < (maxAmountPerTransactionLimit / 100);
      return await assert.equal(result, true, "Test FAILED.Foreign POA balance is not correct after transaction");
    });

  test.it('ERC20-ERC20 - Home account has received correct amount of tokens after transaction ',
    async function () {
      let newHomeBalance = await mainPage.getForeignPOABalance();
      let shouldBe = homeBalanceBefore + maxAmountPerTransactionLimit;
      console.log("newHomeBalance = " + newHomeBalance);
      console.log("shouldBe = " + shouldBe);
      let result = (Math.abs(shouldBe - newHomeBalance)) < (maxAmountPerTransactionLimit / 100);
      return await assert.equal(result, true, "Test FAILED.Home POA balance is not correct after transaction");
    });
  test.it('ERC20-ERC20 - User is able to send tokens from Home account to Foreign account ',
    async function () {
      await homeAccount.setMetaMaskNetwork();
      homeBalanceBefore = await mainPage.getHomePOABalance();
      foreignBalanceBefore = await mainPage.getForeignPOABalance();
      let result = await homeAccount.transferTokens(maxAmountPerTransactionLimit);
      return await assert.equal(result, true, "Test FAILED. User is able send tokens from Home account to Foreign account");
    });

  test.it('ERC20-ERC20 - Home POA balance has correctly changed after transaction',
    async function () {
      let newHomeBalance = await mainPage.getHomePOABalance();
      let shouldBe = homeBalanceBefore - maxAmountPerTransactionLimit;
      console.log("newHomeBalance = " + newHomeBalance);
      console.log("shouldBe = " + shouldBe);
      let result = (Math.abs(shouldBe - newHomeBalance)) < (maxAmountPerTransactionLimit / 100);
      homeBalanceBefore = newHomeBalance;
      return await assert.equal(result, true, "Test FAILED.Home POA balance is not correct after transaction");
    });

  test.it('ERC20-ERC20 - Foreign account has received correct amount of tokens after transaction ',
    async function () {
      let newForeignBalance = await mainPage.getForeignPOABalance();

      let shouldBe = foreignBalanceBefore + maxAmountPerTransactionLimit;
      console.log("newForeignBalance = " + newForeignBalance);
      console.log("shouldBe = " + shouldBe);

      let result = (Math.abs(shouldBe - newForeignBalance)) < (maxAmountPerTransactionLimit / 100);
      return await assert.equal(result, true, "Test FAILED. Foreign POA balance is not correct after transaction");
    });

  test.it('ERC20-Native - User is able to open main page of bridge-ui  ',
    async function () {
      startURL = await Utils.getErc20NativeStartURL();
      let result = await  mainPage.open(startURL);
      console.log("Test URL:  " + startURL);
      return await assert.equal(result, true, "Test FAILED. Build failed.");
    });

  test.it('ERC20-Native - Home page: disclaimer is displayed  ',
    async function () {
      let result = await  mainPage.confirmDisclaimer();
      return await assert.equal(result, true, "Test FAILED. Disclaimer is not displayed");
    });

  test.it('ERC20-Native - Main page: foreign erc20 balance is displayed ',
    async function () {
      await foreignAccount.setMetaMaskNetwork();
      foreignBalanceBefore = await mainPage.getForeignPOABalance();
      console.log("foreignBalanceBefore = "+foreignBalanceBefore);
      let result = foreignBalanceBefore !== 0;
      return await assert.equal(result, true, "Test FAILED. Foreign erc20 balance is zero");
    });

  test.it('ERC20-Native - Main page: home erc20 balance is displayed ',
    async function () {
      homeBalanceBefore = await mainPage.getHomePOABalance();
      console.log("homeBalanceBefore = "+homeBalanceBefore);
      let result = homeBalanceBefore !== 0;
      return await assert.equal(result, true, "Test FAILED. Home erc20 balance is zero or not displayed ");
    });

  test.it('ERC20-Native - User is able to send tokens from Foreign account to Home account ',
    async function () {
      homeBalanceBefore = await mainPage.getForeignPOABalance();
      foreignBalanceBefore = await mainPage.getHomePOABalance();
      let result = await foreignAccount.transferTokens(maxAmountPerTransactionLimit);
      return await assert.equal(result, true, "Test FAILED. User is able send tokens from Foreign account to Home account");
    });

  test.it('ERC20-Native - Foreign POA balance has correctly changed after transaction',
    async function () {
      let newForeignBalance = await mainPage.getHomePOABalance();
      let shouldBe = foreignBalanceBefore - maxAmountPerTransactionLimit;
      console.log("newForeignBalance = " + newForeignBalance);
      console.log("shouldBe = " + shouldBe);
      let result = (Math.abs(shouldBe - newForeignBalance)) < (maxAmountPerTransactionLimit / 100);
      return await assert.equal(result, true, "Test FAILED.Foreign POA balance is not correct after transaction");
    });

  test.it('ERC20-Native - Home account has received correct amount of tokens after transaction ',
    async function () {
      let newHomeBalance = await mainPage.getForeignPOABalance();
      let shouldBe = homeBalanceBefore + maxAmountPerTransactionLimit;
      console.log("newHomeBalance = " + newHomeBalance);
      console.log("shouldBe = " + shouldBe);
      let result = (Math.abs(shouldBe - newHomeBalance)) < (maxAmountPerTransactionLimit / 100);
      return await assert.equal(result, true, "Test FAILED.Home POA balance is not correct after transaction");
    });
  test.it('ERC20-Native - User is able to send tokens from Home account to Foreign account ',
    async function () {
      await homeAccount.setMetaMaskNetwork();
      homeBalanceBefore = await mainPage.getHomePOABalance();
      foreignBalanceBefore = await mainPage.getForeignPOABalance();
      let result = await homeAccount.transferTokens(maxAmountPerTransactionLimit);
      return await assert.equal(result, true, "Test FAILED. User is able send tokens from Home account to Foreign account");
    });

  test.it('ERC20-Native - Home POA balance has correctly changed after transaction',
    async function () {
      let newHomeBalance = await mainPage.getHomePOABalance();
      let shouldBe = homeBalanceBefore - maxAmountPerTransactionLimit;
      console.log("newHomeBalance = " + newHomeBalance);
      console.log("shouldBe = " + shouldBe);
      let result = (Math.abs(shouldBe - newHomeBalance)) < (maxAmountPerTransactionLimit / 100);
      homeBalanceBefore = newHomeBalance;
      return await assert.equal(result, true, "Test FAILED.Home POA balance is not correct after transaction");
    });

  test.it('ERC20-Native - Foreign account has received correct amount of tokens after transaction ',
    async function () {
      let newForeignBalance = await mainPage.getForeignPOABalance();

      let shouldBe = foreignBalanceBefore + maxAmountPerTransactionLimit;
      console.log("newForeignBalance = " + newForeignBalance);
      console.log("shouldBe = " + shouldBe);

      let result = (Math.abs(shouldBe - newForeignBalance)) < (maxAmountPerTransactionLimit / 100);
      return await assert.equal(result, true, "Test FAILED. Foreign POA balance is not correct after transaction");
    });
});
