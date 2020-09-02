const test = require('selenium-webdriver/testing')
const assert = require('assert')
const { Utils } = require('./Utils.js')
const { MetaMask } = require('./MetaMask.js')
const { MainPage } = require('./mainPage.js')
const { User } = require('./User.js')

test.describe('e2e-test for bridge.poa, version 1.5.0', async function() {
  this.timeout(5 * 60000)
  this.slow(1 * 60000)
  this.retries(2)

  const maxAmountPerTransactionLimit = 1
  let startURL
  let driver
  let mainPage
  let homeAccount
  let foreignAccount
  let metaMask
  let foreignBalanceBefore
  let homeBalanceBefore

  test.before(async () => {
    try {
      driver = await Utils.startBrowserWithMetamask()
      mainPage = new MainPage(driver)
      homeAccount = new User(driver, await Utils.getHomeAccount())
      foreignAccount = new User(driver, await Utils.getForeignAccount())
      metaMask = new MetaMask(driver)
      await metaMask.activate()
      await homeAccount.setMetaMaskAccount()
    } catch (e) {
      console.log(e)
    }
  })

  test.after(async () => {
    try {
      await driver.quit()
    } catch (e) {
      console.log(e)
    }
  })

  test.describe('NATIVE TO ERC', async () => {
    test.it('User is able to open main page of bridge-ui ', async () => {
      startURL = await Utils.getStartURL()
      const result = await mainPage.open(startURL)
      console.log('Test URL:  ' + startURL)
      return await assert.strictEqual(result, true, 'Test FAILED. Build failed.')
    })

    test.it('Home page: disclaimer is displayed ', async () => {
      const result = await mainPage.confirmDisclaimer()
      return await assert.strictEqual(result, true, 'Test FAILED. Disclaimer is not displayed')
    })

    test.it('Main page: foreign POA balance is displayed', async () => {
      foreignBalanceBefore = await mainPage.getForeignPOABalance()
      console.log('foreignBalanceBefore = ' + foreignBalanceBefore)
      const result = foreignBalanceBefore === 0
      return await assert.strictEqual(result, true, 'Test FAILED.Foreign POA balance is zero or not displayed ')
    })

    test.it('Main page: home POA balance is displayed', async () => {
      homeBalanceBefore = await mainPage.getHomePOABalance()
      console.log('homeBalanceBefore = ' + homeBalanceBefore)
      const result = homeBalanceBefore !== 0
      return await assert.strictEqual(result, true, 'Test FAILED.Home POA balance is zero or not displayed ')
    })

    test.it('User is able to send tokens from Home account to Foreign account', async () => {
      const result = await homeAccount.transferTokens(maxAmountPerTransactionLimit)
      return await assert.strictEqual(
        result,
        true,
        'Test FAILED. User is able send tokens from Home account to Foreign account'
      )
    })

    test.it('Home POA balance has correctly changed after transaction', async () => {
      const newHomeBalance = await mainPage.getHomePOABalance()
      const shouldBe = homeBalanceBefore - maxAmountPerTransactionLimit
      console.log('newHomeBalance = ' + newHomeBalance)
      console.log('shouldBe = ' + shouldBe)
      const result = Math.abs(shouldBe - newHomeBalance) < maxAmountPerTransactionLimit / 10
      homeBalanceBefore = newHomeBalance
      return await assert.strictEqual(result, true, 'Test FAILED.Home POA balance is not correct after transaction')
    })

    test.it('Foreign account has received correct amount of tokens after transaction ', async () => {
      const newForeignBalance = await mainPage.getForeignPOABalance()

      const shouldBe = foreignBalanceBefore + maxAmountPerTransactionLimit
      console.log('newForeignBalance = ' + newForeignBalance)
      console.log('shouldBe = ' + shouldBe)

      const result = Math.abs(shouldBe - newForeignBalance) < maxAmountPerTransactionLimit / 10
      return await assert.strictEqual(result, true, 'Test FAILED. Foreign POA balance is not correct after transaction')
    })

    test.it('User is able to send tokens from Foreign account to Home account', async () => {
      await foreignAccount.setMetaMaskNetwork()
      foreignBalanceBefore = await mainPage.getHomePOABalance()
      const result = await foreignAccount.transferTokens(maxAmountPerTransactionLimit)
      return await assert.strictEqual(
        result,
        true,
        'Test FAILED. User is able send tokens from Home account to Foreign account'
      )
    })

    test.it('Foreign POA balance has correctly changed after transaction', async () => {
      const newForeignBalance = await mainPage.getHomePOABalance()
      const shouldBe = foreignBalanceBefore - maxAmountPerTransactionLimit
      console.log('newForeignBalance = ' + newForeignBalance)
      console.log('shouldBe = ' + shouldBe)
      const result = Math.abs(shouldBe - newForeignBalance) < maxAmountPerTransactionLimit / 10
      return await assert.strictEqual(result, true, 'Test FAILED.Foreign POA balance is not correct after transaction')
    })

    test.it('Home account has received correct amount of tokens after transaction', async () => {
      const newHomeBalance = await mainPage.getForeignPOABalance()
      const shouldBe = homeBalanceBefore + maxAmountPerTransactionLimit
      console.log('newHomeBalance = ' + newHomeBalance)
      console.log('shouldBe = ' + shouldBe)
      const result = Math.abs(shouldBe - newHomeBalance) < maxAmountPerTransactionLimit / 10
      return await assert.strictEqual(result, true, 'Test FAILED.Home POA balance is not correct after transaction')
    })
  })

  test.describe('ERC TO ERC', async () => {
    test.it('User is able to open main page of bridge-ui ', async () => {
      await foreignAccount.setMetaMaskNetwork()
      startURL = await Utils.getErc20StartURL()
      const result = await mainPage.open(startURL)
      console.log('Test URL:  ' + startURL)
      return await assert.strictEqual(result, true, 'Test FAILED. Build failed.')
    })

    test.it('Home page: disclaimer is displayed ', async () => {
      const result = await mainPage.confirmDisclaimer()
      return await assert.strictEqual(result, true, 'Test FAILED. Disclaimer is not displayed')
    })

    test.it('Main page: foreign erc20 balance is displayed', async () => {
      foreignBalanceBefore = await mainPage.getForeignPOABalance()
      console.log('foreignBalanceBefore = ' + foreignBalanceBefore)
      const result = foreignBalanceBefore === 0
      return await assert.strictEqual(result, true, 'Test FAILED. Foreign erc20 balance is not zero')
    })

    test.it('Main page: home erc20 balance is displayed', async () => {
      homeBalanceBefore = await mainPage.getHomePOABalance()
      console.log('homeBalanceBefore = ' + homeBalanceBefore)
      const result = homeBalanceBefore !== 0
      return await assert.strictEqual(result, true, 'Test FAILED. Home erc20 balance is zero or not displayed ')
    })

    test.it('User is able to send tokens from Foreign account to Home account ', async () => {
      homeBalanceBefore = await mainPage.getForeignPOABalance()
      foreignBalanceBefore = await mainPage.getHomePOABalance()
      const result = await foreignAccount.transferTokens(maxAmountPerTransactionLimit)
      return await assert.strictEqual(
        result,
        true,
        'Test FAILED. User is able send tokens from Foreign account to Home account'
      )
    })

    test.it('Foreign POA balance has correctly changed after transaction', async () => {
      const newForeignBalance = await mainPage.getHomePOABalance()
      const shouldBe = foreignBalanceBefore - maxAmountPerTransactionLimit
      console.log('newForeignBalance = ' + newForeignBalance)
      console.log('shouldBe = ' + shouldBe)
      const result = Math.abs(shouldBe - newForeignBalance) < maxAmountPerTransactionLimit / 10
      return await assert.strictEqual(result, true, 'Test FAILED.Foreign POA balance is not correct after transaction')
    })

    test.it('Home account has received correct amount of tokens after transaction ', async () => {
      const newHomeBalance = await mainPage.getForeignPOABalance()
      const shouldBe = homeBalanceBefore + maxAmountPerTransactionLimit
      console.log('newHomeBalance = ' + newHomeBalance)
      console.log('shouldBe = ' + shouldBe)
      const result = Math.abs(shouldBe - newHomeBalance) < maxAmountPerTransactionLimit / 10
      return await assert.strictEqual(result, true, 'Test FAILED.Home POA balance is not correct after transaction')
    })
    test.it('User is able to send tokens from Home account to Foreign account ', async () => {
      await homeAccount.setMetaMaskNetwork()
      homeBalanceBefore = await mainPage.getHomePOABalance()
      foreignBalanceBefore = await mainPage.getForeignPOABalance()
      const result = await homeAccount.transferTokens(maxAmountPerTransactionLimit)
      return await assert.strictEqual(
        result,
        true,
        'Test FAILED. User is able send tokens from Home account to Foreign account'
      )
    })

    test.it('Home POA balance has correctly changed after transaction', async () => {
      const newHomeBalance = await mainPage.getHomePOABalance()
      const shouldBe = homeBalanceBefore - maxAmountPerTransactionLimit
      console.log('newHomeBalance = ' + newHomeBalance)
      console.log('shouldBe = ' + shouldBe)
      const result = Math.abs(shouldBe - newHomeBalance) < maxAmountPerTransactionLimit / 10
      homeBalanceBefore = newHomeBalance
      return await assert.strictEqual(result, true, 'Test FAILED.Home POA balance is not correct after transaction')
    })

    test.it('Foreign account has received correct amount of tokens after transaction ', async () => {
      const newForeignBalance = await mainPage.getForeignPOABalance()

      const shouldBe = foreignBalanceBefore + maxAmountPerTransactionLimit
      console.log('newForeignBalance = ' + newForeignBalance)
      console.log('shouldBe = ' + shouldBe)

      const result = Math.abs(shouldBe - newForeignBalance) < maxAmountPerTransactionLimit / 10
      return await assert.strictEqual(result, true, 'Test FAILED. Foreign POA balance is not correct after transaction')
    })
  })

  test.describe('ERC TO NATIVE', async () => {
    test.it('User is able to open main page of bridge-ui ', async () => {
      startURL = await Utils.getErc20NativeStartURL()
      const result = await mainPage.open(startURL)
      console.log('Test URL:  ' + startURL)
      return await assert.strictEqual(result, true, 'Test FAILED. Build failed.')
    })

    test.it('Home page: disclaimer is displayed ', async () => {
      const result = await mainPage.confirmDisclaimer()
      return await assert.strictEqual(result, true, 'Test FAILED. Disclaimer is not displayed')
    })

    test.it('Main page: foreign erc20 balance is displayed', async () => {
      await foreignAccount.setMetaMaskNetwork()
      foreignBalanceBefore = await mainPage.getForeignPOABalance()
      console.log('foreignBalanceBefore = ' + foreignBalanceBefore)
      const result = foreignBalanceBefore !== 0
      return await assert.strictEqual(result, true, 'Test FAILED. Foreign erc20 balance is zero')
    })

    test.it('Main page: home erc20 balance is displayed', async () => {
      homeBalanceBefore = await mainPage.getHomePOABalance()
      console.log('homeBalanceBefore = ' + homeBalanceBefore)
      const result = homeBalanceBefore !== 0
      return await assert.strictEqual(result, true, 'Test FAILED. Home erc20 balance is zero or not displayed ')
    })

    test.it('User is able to send tokens from Foreign account to Home account', async () => {
      homeBalanceBefore = await mainPage.getForeignPOABalance()
      foreignBalanceBefore = await mainPage.getHomePOABalance()
      const result = await foreignAccount.transferTokens(maxAmountPerTransactionLimit)
      return await assert.strictEqual(
        result,
        true,
        'Test FAILED. User is able send tokens from Foreign account to Home account'
      )
    })

    test.it('Foreign POA balance has correctly changed after transaction', async () => {
      const newForeignBalance = await mainPage.getHomePOABalance()
      const shouldBe = foreignBalanceBefore - maxAmountPerTransactionLimit
      console.log('newForeignBalance = ' + newForeignBalance)
      console.log('shouldBe = ' + shouldBe)
      const result = Math.abs(shouldBe - newForeignBalance) < maxAmountPerTransactionLimit / 10
      return await assert.strictEqual(result, true, 'Test FAILED.Foreign POA balance is not correct after transaction')
    })

    test.it('Home account has received correct amount of tokens after transaction', async () => {
      const newHomeBalance = await mainPage.getForeignPOABalance()
      const shouldBe = homeBalanceBefore + maxAmountPerTransactionLimit
      console.log('newHomeBalance = ' + newHomeBalance)
      console.log('shouldBe = ' + shouldBe)
      const result = Math.abs(shouldBe - newHomeBalance) < maxAmountPerTransactionLimit / 10
      return await assert.strictEqual(result, true, 'Test FAILED.Home POA balance is not correct after transaction')
    })
    test.it('User is able to send tokens from Home account to Foreign account', async () => {
      await homeAccount.setMetaMaskNetwork()
      homeBalanceBefore = await mainPage.getHomePOABalance()
      foreignBalanceBefore = await mainPage.getForeignPOABalance()
      const result = await homeAccount.transferTokens(maxAmountPerTransactionLimit)
      return await assert.strictEqual(
        result,
        true,
        'Test FAILED. User is able send tokens from Home account to Foreign account'
      )
    })

    test.it('Home POA balance has correctly changed after transaction', async () => {
      const newHomeBalance = await mainPage.getHomePOABalance()
      const shouldBe = homeBalanceBefore - maxAmountPerTransactionLimit
      console.log('newHomeBalance = ' + newHomeBalance)
      console.log('shouldBe = ' + shouldBe)
      const result = Math.abs(shouldBe - newHomeBalance) < maxAmountPerTransactionLimit / 10
      homeBalanceBefore = newHomeBalance
      return await assert.strictEqual(result, true, 'Test FAILED.Home POA balance is not correct after transaction')
    })

    test.it('Foreign account has received correct amount of tokens after transaction', async () => {
      const newForeignBalance = await mainPage.getForeignPOABalance()

      const shouldBe = foreignBalanceBefore + maxAmountPerTransactionLimit
      console.log('newForeignBalance = ' + newForeignBalance)
      console.log('shouldBe = ' + shouldBe)

      const result = Math.abs(shouldBe - newForeignBalance) < maxAmountPerTransactionLimit / 10
      return await assert.strictEqual(result, true, 'Test FAILED. Foreign POA balance is not correct after transaction')
    })
  })

  test.describe('AMB-STAKE-ERC-TO-ERC', async () => {
    test.it('User is able to open main page of bridge-ui ', async () => {
      startURL = await Utils.getAMBStakeStartURL()
      const result = await mainPage.open(startURL)
      console.log('Test URL:  ' + startURL)
      return await assert.strictEqual(result, true, 'Test FAILED. Build failed.')
    })

    test.it('Home page: disclaimer is displayed ', async () => {
      const result = await mainPage.confirmDisclaimer()
      return await assert.strictEqual(result, true, 'Test FAILED. Disclaimer is not displayed')
    })

    test.it('Main page: foreign erc20 balance is displayed', async () => {
      await foreignAccount.setMetaMaskNetwork()
      foreignBalanceBefore = await mainPage.getForeignPOABalance()
      console.log('foreignBalanceBefore = ' + foreignBalanceBefore)
      const result = foreignBalanceBefore !== 0
      return await assert.strictEqual(result, true, 'Test FAILED. Foreign erc20 balance is zero')
    })

    test.it('Main page: home erc20 balance is displayed', async () => {
      homeBalanceBefore = await mainPage.getHomePOABalance()
      console.log('homeBalanceBefore = ' + homeBalanceBefore)
      const result = homeBalanceBefore !== 0
      return await assert.strictEqual(result, true, 'Test FAILED. Home erc20 balance is zero or not displayed ')
    })

    test.it('User is able to send tokens from Foreign account to Home account', async () => {
      homeBalanceBefore = await mainPage.getForeignPOABalance()
      foreignBalanceBefore = await mainPage.getHomePOABalance()
      const result = await foreignAccount.transferTokens(maxAmountPerTransactionLimit)
      return await assert.strictEqual(
        result,
        true,
        'Test FAILED. User is able send tokens from Foreign account to Home account'
      )
    })

    test.it('Foreign POA balance has correctly changed after transaction', async () => {
      const newForeignBalance = await mainPage.getHomePOABalance()
      const shouldBe = foreignBalanceBefore - maxAmountPerTransactionLimit
      console.log('newForeignBalance = ' + newForeignBalance)
      console.log('shouldBe = ' + shouldBe)
      const result = Math.abs(shouldBe - newForeignBalance) < maxAmountPerTransactionLimit / 10
      return await assert.strictEqual(result, true, 'Test FAILED.Foreign POA balance is not correct after transaction')
    })

    test.it('Home account has received correct amount of tokens after transaction', async () => {
      const newHomeBalance = await mainPage.getForeignPOABalance()
      const shouldBe = homeBalanceBefore + maxAmountPerTransactionLimit
      console.log('newHomeBalance = ' + newHomeBalance)
      console.log('shouldBe = ' + shouldBe)
      const result = Math.abs(shouldBe - newHomeBalance) < maxAmountPerTransactionLimit / 10
      return await assert.strictEqual(result, true, 'Test FAILED.Home POA balance is not correct after transaction')
    })
    test.it('User is able to send tokens from Home account to Foreign account', async () => {
      await homeAccount.setMetaMaskNetwork()
      homeBalanceBefore = await mainPage.getHomePOABalance()
      foreignBalanceBefore = await mainPage.getForeignPOABalance()
      const result = await homeAccount.transferTokens(maxAmountPerTransactionLimit)
      return await assert.strictEqual(
        result,
        true,
        'Test FAILED. User is able send tokens from Home account to Foreign account'
      )
    })

    test.it('Home POA balance has correctly changed after transaction', async () => {
      const newHomeBalance = await mainPage.getHomePOABalance()
      const shouldBe = homeBalanceBefore - maxAmountPerTransactionLimit
      console.log('newHomeBalance = ' + newHomeBalance)
      console.log('shouldBe = ' + shouldBe)
      const result = Math.abs(shouldBe - newHomeBalance) < maxAmountPerTransactionLimit / 10
      homeBalanceBefore = newHomeBalance
      return await assert.strictEqual(result, true, 'Test FAILED.Home POA balance is not correct after transaction')
    })

    test.it('Foreign account has received correct amount of tokens after transaction', async () => {
      const newForeignBalance = await mainPage.getForeignPOABalance()

      const shouldBe = foreignBalanceBefore + maxAmountPerTransactionLimit
      console.log('newForeignBalance = ' + newForeignBalance)
      console.log('shouldBe = ' + shouldBe)

      const result = Math.abs(shouldBe - newForeignBalance) < maxAmountPerTransactionLimit / 10
      return await assert.strictEqual(result, true, 'Test FAILED. Foreign POA balance is not correct after transaction')
    })
  })
})
