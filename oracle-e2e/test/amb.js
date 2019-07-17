const Web3 = require('web3')
const assert = require('assert')
const promiseRetry = require('promise-retry')
const { user, validator, homeRPC, foreignRPC, amb } = require('../../e2e-commons/constants.json')
const { generateNewBlock } = require('../../e2e-commons/utils')
const { HOME_AMB_ABI, FOREIGN_AMB_ABI, BOX_ABI } = require('../../commons')

const { toBN } = Web3.utils

const homeWeb3 = new Web3(new Web3.providers.HttpProvider(homeRPC.URL))
const foreignWeb3 = new Web3(new Web3.providers.HttpProvider(foreignRPC.URL))

homeWeb3.eth.accounts.wallet.add(user.privateKey)
foreignWeb3.eth.accounts.wallet.add(user.privateKey)

homeWeb3.eth.accounts.wallet.add(validator.privateKey)
foreignWeb3.eth.accounts.wallet.add(validator.privateKey)

const homeAMB = new homeWeb3.eth.Contract(HOME_AMB_ABI, amb.home)
const homeBox = new homeWeb3.eth.Contract(BOX_ABI, amb.homeBox)

const foreignAMB = new foreignWeb3.eth.Contract(FOREIGN_AMB_ABI, amb.foreign)
const foreignBox = new foreignWeb3.eth.Contract(BOX_ABI, amb.foreignBox)

const oneEther = foreignWeb3.utils.toWei('1', 'ether')
const subsidizedHash = homeWeb3.utils.toHex('AMB-subsidized-mode')

describe('arbitrary message bridging', () => {
  describe('Home to Foreign', () => {
    describe('Defrayal Mode', () => {
      it('should be able to deposit funds for home sender', async () => {
        const initialBalance = await foreignAMB.methods.balanceOf(amb.homeBox).call()
        assert(toBN(initialBalance).isZero(), 'Balance should be zero')

        await foreignAMB.methods.depositForContractSender(amb.homeBox).send({
          from: user.address,
          gas: '1000000',
          value: oneEther
        })

        const balance = await foreignAMB.methods.balanceOf(amb.homeBox).call()
        assert(toBN(balance).eq(toBN(oneEther)), 'Balance should be one ether')
      })
      it('should bridge message and take fees', async () => {
        const newValue = 9

        const initialValue = await foreignBox.methods.value().call()
        assert(toBN(initialValue).isZero(), 'Value should be zero')

        const initialBalance = await foreignAMB.methods.balanceOf(amb.homeBox).call()
        assert(!toBN(initialBalance).isZero(), 'Balance should not be zero')

        const setValueTx = await homeBox.methods
          .setValueOnOtherNetworkGasPrice(newValue, amb.home, amb.foreignBox, '1000000000')
          .send({
            from: user.address,
            gas: '1000000'
          })
          .catch(e => {
            console.error(e)
          })

        // Send a trivial transaction to generate a new block since the watcher
        // is configured to wait 1 confirmation block
        await generateNewBlock(homeWeb3, user.address)

        // The bridge should create a new transaction with a CollectedSignatures
        // event so we generate another trivial transaction
        await promiseRetry(
          async retry => {
            const lastBlockNumber = await homeWeb3.eth.getBlockNumber()
            if (lastBlockNumber >= setValueTx.blockNumber + 2) {
              await generateNewBlock(homeWeb3, user.address)
            } else {
              retry()
            }
          },
          {
            forever: true,
            factor: 1,
            minTimeout: 500
          }
        )

        // check that value changed and balance decreased
        await promiseRetry(async retry => {
          const value = await foreignBox.methods.value().call()
          const balance = await foreignAMB.methods.balanceOf(amb.homeBox).call()
          if (!toBN(value).eq(toBN(newValue)) || toBN(balance).gte(toBN(oneEther))) {
            retry()
          }
        })
      })
      it('should be able to withdraw from deposit', async () => {
        const initialBalance = await foreignAMB.methods.balanceOf(amb.homeBox).call()
        assert(!toBN(initialBalance).isZero(), 'Balance should not be zero')

        const initialUserBalance = toBN(await foreignWeb3.eth.getBalance(user.address))

        const tx = await homeBox.methods
          .withdrawFromDepositOnOtherNetworkGasPrice(
            user.address,
            amb.home,
            amb.foreign,
            '1000000000'
          )
          .send({
            from: user.address,
            gas: '1000000'
          })
          .catch(e => {
            console.error(e)
          })

        // Send a trivial transaction to generate a new block since the watcher
        // is configured to wait 1 confirmation block
        await generateNewBlock(homeWeb3, user.address)

        // The bridge should create a new transaction with a CollectedSignatures
        // event so we generate another trivial transaction
        await promiseRetry(
          async retry => {
            const lastBlockNumber = await homeWeb3.eth.getBlockNumber()
            if (lastBlockNumber >= tx.blockNumber + 2) {
              await generateNewBlock(homeWeb3, user.address)
            } else {
              retry()
            }
          },
          {
            forever: true,
            factor: 1,
            minTimeout: 500
          }
        )

        // check that value changed and balance decreased
        await promiseRetry(async retry => {
          const userBalance = toBN(await foreignWeb3.eth.getBalance(user.address))
          const boxBalance = toBN(await foreignAMB.methods.balanceOf(amb.homeBox).call())
          if (!boxBalance.isZero() || userBalance.lte(initialUserBalance)) {
            retry()
          }
        })
      })
    })
    describe('Subsidized Mode', () => {
      it('should bridge message without taking fees', async () => {
        const newValue = 3

        await homeAMB.methods.setSubsidizedModeForHomeToForeign().send({
          from: validator.address,
          gas: '1000000'
        })
        const homeMode = await homeAMB.methods.homeToForeignMode().call()

        await foreignAMB.methods.setSubsidizedModeForHomeToForeign().send({
          from: validator.address,
          gas: '1000000'
        })
        const foreignMode = await foreignAMB.methods.homeToForeignMode().call()

        assert(homeMode === subsidizedHash, 'home mode incorrect')
        assert(foreignMode === subsidizedHash, 'foreign mode incorrect')

        const initialValue = await foreignBox.methods.value().call()
        assert(
          !toBN(initialValue).eq(toBN(newValue)),
          'initial value should be different from new value'
        )

        const setValueTx = await homeBox.methods
          .setValueOnOtherNetworkGasPrice(newValue, amb.home, amb.foreignBox, '1000000000')
          .send({
            from: user.address,
            gas: '1000000'
          })
          .catch(e => {
            console.error(e)
          })

        // Send a trivial transaction to generate a new block since the watcher
        // is configured to wait 1 confirmation block
        await generateNewBlock(homeWeb3, user.address)

        // The bridge should create a new transaction with a CollectedSignatures
        // event so we generate another trivial transaction
        await promiseRetry(
          async retry => {
            const lastBlockNumber = await homeWeb3.eth.getBlockNumber()
            if (lastBlockNumber >= setValueTx.blockNumber + 2) {
              await generateNewBlock(homeWeb3, user.address)
            } else {
              retry()
            }
          },
          {
            forever: true,
            factor: 1,
            minTimeout: 500
          }
        )

        // check that value changed and balance decreased
        await promiseRetry(async retry => {
          const value = await foreignBox.methods.value().call()
          if (!toBN(value).eq(toBN(newValue))) {
            retry()
          }
        })
      })
    })
  })
  describe('Foreign to Home', () => {
    describe('Defrayal Mode', () => {
      it('should be able to deposit funds for foreign sender', async () => {
        const initialBalance = await homeAMB.methods.balanceOf(amb.foreignBox).call()
        assert(toBN(initialBalance).isZero(), 'Balance should be zero')

        await homeAMB.methods.depositForContractSender(amb.homeBox).send({
          from: user.address,
          gas: '1000000',
          value: oneEther
        })

        const balance = await homeAMB.methods.balanceOf(amb.foreignBox).call()
        assert(toBN(balance).eq(toBN(oneEther)), 'Balance should be one ether')
      })
      it('should bridge message and take fees', async () => {
        const newValue = 6

        const initialValue = await homeBox.methods.value().call()
        assert(toBN(initialValue).isZero(), 'Value should be zero')

        const initialBalance = await homeAMB.methods.balanceOf(amb.foreignBox).call()
        assert(!toBN(initialBalance).isZero(), 'Balance should not be zero')

        await foreignBox.methods
          .setValueOnOtherNetworkGasPrice(newValue, amb.foreign, amb.homeBox, '1000000000')
          .send({
            from: user.address,
            gas: '1000000'
          })
          .catch(e => {
            console.error(e)
          })

        // Send a trivial transaction to generate a new block since the watcher
        // is configured to wait 1 confirmation block
        await generateNewBlock(foreignWeb3, user.address)

        // check that value changed and balance decreased
        await promiseRetry(async retry => {
          const value = await homeBox.methods.value().call()
          const balance = await homeAMB.methods.balanceOf(amb.foreignBox).call()
          if (!toBN(value).eq(toBN(newValue)) || toBN(balance).gte(toBN(oneEther))) {
            retry()
          }
        })
      })
      it('should be able to withdraw from deposit', async () => {
        const initialBalance = await homeAMB.methods.balanceOf(amb.foreignBox).call()
        assert(!toBN(initialBalance).isZero(), 'Balance should not be zero')

        const initialUserBalance = toBN(await homeWeb3.eth.getBalance(user.address))

        await foreignBox.methods
          .withdrawFromDepositOnOtherNetworkGasPrice(
            user.address,
            amb.foreign,
            amb.home,
            '1000000000'
          )
          .send({
            from: user.address,
            gas: '1000000'
          })
          .catch(e => {
            console.error(e)
          })

        // Send a trivial transaction to generate a new block since the watcher
        // is configured to wait 1 confirmation block
        await generateNewBlock(foreignWeb3, user.address)

        // check that value changed and balance decreased
        await promiseRetry(async retry => {
          const userBalance = toBN(await homeWeb3.eth.getBalance(user.address))
          const boxBalance = toBN(await homeAMB.methods.balanceOf(amb.foreignBox).call())
          if (!boxBalance.isZero() || userBalance.lte(initialUserBalance)) {
            retry()
          }
        })
      })
    })
    describe('Subsidized Mode', () => {
      it('should bridge message without taking fees', async () => {
        const newValue = 7

        await homeAMB.methods.setSubsidizedModeForForeignToHome().send({
          from: validator.address,
          gas: '1000000'
        })

        const homeMode = await homeAMB.methods.foreignToHomeMode().call()

        await foreignAMB.methods.setSubsidizedModeForForeignToHome().send({
          from: validator.address,
          gas: '1000000'
        })

        const foreignMode = await foreignAMB.methods.foreignToHomeMode().call()

        assert(homeMode === subsidizedHash, 'home mode incorrect')
        assert(foreignMode === subsidizedHash, 'foreign mode incorrect')

        const initialValue = await homeBox.methods.value().call()
        assert(
          !toBN(initialValue).eq(toBN(newValue)),
          'initial value should be different from new value'
        )

        await foreignBox.methods
          .setValueOnOtherNetworkGasPrice(newValue, amb.home, amb.foreignBox, '1000000000')
          .send({
            from: user.address,
            gas: '1000000'
          })
          .catch(e => {
            console.error(e)
          })

        // Send a trivial transaction to generate a new block since the watcher
        // is configured to wait 1 confirmation block
        await generateNewBlock(foreignWeb3, user.address)

        // check that value changed and balance decreased
        await promiseRetry(async retry => {
          const value = await homeBox.methods.value().call()
          if (!toBN(value).eq(toBN(newValue))) {
            retry()
          }
        })
      })
    })
  })
})
