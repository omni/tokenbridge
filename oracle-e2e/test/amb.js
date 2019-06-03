const path = require('path')
const Web3 = require('web3')
const assert = require('assert')
const promiseRetry = require('promise-retry')
const { user, validator, contractsPath } = require('../constants.json')
const { generateNewBlock } = require('../utils/utils')
const { toBN } = Web3.utils

const abisDir = path.join(__dirname, '..', contractsPath, 'build/contracts')

const homeWeb3 = new Web3(new Web3.providers.HttpProvider('http://parity1:8545'))
const foreignWeb3 = new Web3(new Web3.providers.HttpProvider('http://parity2:8545'))

const homeBridgeAddress = '0x0AEe1FCD12dDFab6265F7f8956e6E012A9Fe4Aa0'
const foreignBridgeAddress = '0x0AEe1FCD12dDFab6265F7f8956e6E012A9Fe4Aa0'

const homeBoxAddress = '0x6C4EaAb8756d53Bf599FFe2347FAFF1123D6C8A1'
const foreignBoxAddress = '0x6C4EaAb8756d53Bf599FFe2347FAFF1123D6C8A1'

homeWeb3.eth.accounts.wallet.add(user.privateKey)
foreignWeb3.eth.accounts.wallet.add(user.privateKey)

homeWeb3.eth.accounts.wallet.add(validator.privateKey)
foreignWeb3.eth.accounts.wallet.add(validator.privateKey)

const homeAbi = require(path.join(abisDir, 'HomeAMB.json')).abi
const foreignAbi = require(path.join(abisDir, 'ForeignAMB.json')).abi
const boxAbi = require(path.join(abisDir, 'Box.json')).abi

const homeAMB = new homeWeb3.eth.Contract(homeAbi, homeBridgeAddress)
const homeBox = new homeWeb3.eth.Contract(boxAbi, homeBoxAddress)

const foreignAMB = new foreignWeb3.eth.Contract(foreignAbi, foreignBridgeAddress)
const foreignBox = new foreignWeb3.eth.Contract(boxAbi, foreignBoxAddress)

const oneEther = foreignWeb3.utils.toWei('1', 'ether')
const subsidizedHash = homeWeb3.utils.toHex('AMB-subsidized-mode')

describe('arbitrary message bridging', () => {
  describe('Home to Foreign', () => {
    describe('Defrayal Mode', () => {
      it('should be able to deposit funds for home sender', async () => {
        const initialBalance = await foreignAMB.methods.balanceOf(homeBoxAddress).call()
        assert(toBN(initialBalance).isZero(), 'Balance should be zero')

        await foreignAMB.methods.depositForContractSender(homeBoxAddress).send({
          from: user.address,
          gas: '1000000',
          value: oneEther
        })

        const balance = await foreignAMB.methods.balanceOf(homeBoxAddress).call()
        assert(toBN(balance).eq(toBN(oneEther)), 'Balance should be one ether')
      })
      it('should bridge message and take fees', async () => {
        const newValue = 9

        const initialValue = await foreignBox.methods.value().call()
        assert(toBN(initialValue).isZero(), 'Value should be zero')

        const initialBalance = await foreignAMB.methods.balanceOf(homeBoxAddress).call()
        assert(!toBN(initialBalance).isZero(), 'Balance should not be zero')

        const setValueTx = await homeBox.methods
          .setValueOnOtherNetworkGasPrice(
            newValue,
            homeBridgeAddress,
            foreignBoxAddress,
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
          const balance = await foreignAMB.methods.balanceOf(homeBoxAddress).call()
          if (!toBN(value).eq(toBN(newValue)) || toBN(balance).gte(toBN(oneEther))) {
            retry()
          }
        })
      })
      it('should be able to withdraw from deposit', async () => {
        const initialBalance = await foreignAMB.methods.balanceOf(homeBoxAddress).call()
        assert(!toBN(initialBalance).isZero(), 'Balance should not be zero')

        const initialUserBalance = toBN(await foreignWeb3.eth.getBalance(user.address))

        const tx = await homeBox.methods
          .withdrawFromDepositOnOtherNetworkGasPrice(
            user.address,
            homeBridgeAddress,
            foreignBridgeAddress,
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
          const boxBalance = toBN(await foreignAMB.methods.balanceOf(homeBoxAddress).call())
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
          .setValueOnOtherNetworkGasPrice(
            newValue,
            homeBridgeAddress,
            foreignBoxAddress,
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
        const initialBalance = await homeAMB.methods.balanceOf(foreignBoxAddress).call()
        assert(toBN(initialBalance).isZero(), 'Balance should be zero')

        await homeAMB.methods.depositForContractSender(homeBoxAddress).send({
          from: user.address,
          gas: '1000000',
          value: oneEther
        })

        const balance = await homeAMB.methods.balanceOf(foreignBoxAddress).call()
        assert(toBN(balance).eq(toBN(oneEther)), 'Balance should be one ether')
      })
      it('should bridge message and take fees', async () => {
        const newValue = 6

        const initialValue = await homeBox.methods.value().call()
        assert(toBN(initialValue).isZero(), 'Value should be zero')

        const initialBalance = await homeAMB.methods.balanceOf(foreignBoxAddress).call()
        assert(!toBN(initialBalance).isZero(), 'Balance should not be zero')

        await foreignBox.methods
          .setValueOnOtherNetworkGasPrice(
            newValue,
            foreignBridgeAddress,
            homeBoxAddress,
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
          const value = await homeBox.methods.value().call()
          const balance = await homeAMB.methods.balanceOf(foreignBoxAddress).call()
          if (!toBN(value).eq(toBN(newValue)) || toBN(balance).gte(toBN(oneEther))) {
            retry()
          }
        })
      })
      it('should be able to withdraw from deposit', async () => {
        const initialBalance = await homeAMB.methods.balanceOf(foreignBoxAddress).call()
        assert(!toBN(initialBalance).isZero(), 'Balance should not be zero')

        const initialUserBalance = toBN(await homeWeb3.eth.getBalance(user.address))

        await foreignBox.methods
          .withdrawFromDepositOnOtherNetworkGasPrice(
            user.address,
            foreignBridgeAddress,
            homeBridgeAddress,
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
          const boxBalance = toBN(await homeAMB.methods.balanceOf(foreignBoxAddress).call())
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
          .setValueOnOtherNetworkGasPrice(
            newValue,
            homeBridgeAddress,
            foreignBoxAddress,
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
          const value = await homeBox.methods.value().call()
          if (!toBN(value).eq(toBN(newValue))) {
            retry()
          }
        })
      })
    })
  })
})
