const Web3 = require('web3')
const assert = require('assert')
const promiseRetry = require('promise-retry')
const { user, homeRPC, foreignRPC, amb } = require('../../e2e-commons/constants.json')
const { generateNewBlock } = require('../../e2e-commons/utils')
const { BOX_ABI } = require('../../commons')

const { toBN } = Web3.utils

const homeWeb3 = new Web3(new Web3.providers.HttpProvider(homeRPC.URL))
const foreignWeb3 = new Web3(new Web3.providers.HttpProvider(foreignRPC.URL))

homeWeb3.eth.accounts.wallet.add(user.privateKey)
foreignWeb3.eth.accounts.wallet.add(user.privateKey)

const homeBox = new homeWeb3.eth.Contract(BOX_ABI, amb.homeBox)
const foreignBox = new foreignWeb3.eth.Contract(BOX_ABI, amb.foreignBox)

describe('arbitrary message bridging', () => {
  describe('Home to Foreign', () => {
    describe('Subsidized Mode', () => {
      it('should bridge message', async () => {
        const newValue = 3

        const initialValue = await foreignBox.methods.value().call()
        assert(!toBN(initialValue).eq(toBN(newValue)), 'initial value should be different from new value')

        const setValueTx = await homeBox.methods
          .setValueOnOtherNetwork(newValue, amb.home, amb.foreignBox)
          .send({
            from: user.address,
            gas: '400000'
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
    describe('Subsidized Mode', () => {
      it('should bridge message', async () => {
        const newValue = 7

        const initialValue = await homeBox.methods.value().call()
        assert(!toBN(initialValue).eq(toBN(newValue)), 'initial value should be different from new value')

        await foreignBox.methods
          .setValueOnOtherNetwork(newValue, amb.foreign, amb.homeBox)
          .send({
            from: user.address,
            gas: '400000'
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
