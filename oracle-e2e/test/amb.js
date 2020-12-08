const Web3 = require('web3')
const assert = require('assert')
const { user, homeRPC, foreignRPC, amb, validator } = require('../../e2e-commons/constants.json')
const { uniformRetry } = require('../../e2e-commons/utils')
const { BOX_ABI, HOME_AMB_ABI, FOREIGN_AMB_ABI } = require('../../commons')
const { delay, setRequiredSignatures } = require('./utils')

const { toBN } = Web3.utils

const homeWeb3 = new Web3(new Web3.providers.HttpProvider(homeRPC.URL))
const foreignWeb3 = new Web3(new Web3.providers.HttpProvider(foreignRPC.URL))

const COMMON_HOME_BRIDGE_ADDRESS = amb.home
const COMMON_FOREIGN_BRIDGE_ADDRESS = amb.foreign

homeWeb3.eth.accounts.wallet.add(user.privateKey)
homeWeb3.eth.accounts.wallet.add(validator.privateKey)
foreignWeb3.eth.accounts.wallet.add(user.privateKey)
foreignWeb3.eth.accounts.wallet.add(validator.privateKey)

const homeBox = new homeWeb3.eth.Contract(BOX_ABI, amb.homeBox)
const blockHomeBox = new homeWeb3.eth.Contract(BOX_ABI, amb.blockedHomeBox)
const foreignBox = new foreignWeb3.eth.Contract(BOX_ABI, amb.foreignBox)
const homeBridge = new homeWeb3.eth.Contract(HOME_AMB_ABI, COMMON_HOME_BRIDGE_ADDRESS)
const foreignBridge = new foreignWeb3.eth.Contract(FOREIGN_AMB_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)

describe('arbitrary message bridging', () => {
  let requiredSignatures = 1
  before(async () => {
    // Only 1 validator is used in ultimate tests
    if (process.env.ULTIMATE !== 'true') {
      requiredSignatures = 2
      // Set 2 required signatures for home bridge
      await setRequiredSignatures({
        bridgeContract: homeBridge,
        web3: homeWeb3,
        requiredSignatures: 2,
        options: {
          from: validator.address,
          gas: '4000000'
        }
      })

      // Set 2 required signatures for foreign bridge
      await setRequiredSignatures({
        bridgeContract: foreignBridge,
        web3: foreignWeb3,
        requiredSignatures: 2,
        options: {
          from: validator.address,
          gas: '4000000'
        }
      })
    }
  })
  describe('Home to Foreign', () => {
    describe('Subsidized Mode', () => {
      it('should bridge message', async () => {
        const newValue = 3

        const initialValue = await foreignBox.methods.value().call()
        assert(!toBN(initialValue).eq(toBN(newValue)), 'initial value should be different from new value')

        await homeBox.methods
          .setValueOnOtherNetwork(newValue, amb.home, amb.foreignBox)
          .send({
            from: user.address,
            gas: '400000'
          })
          .catch(e => {
            console.error(e)
          })

        // check that value changed and balance decreased
        await uniformRetry(async retry => {
          const value = await foreignBox.methods.value().call()
          if (!toBN(value).eq(toBN(newValue))) {
            retry()
          }
        })
      })

      // allowance/block lists files are not mounted to the host during the ultimate test
      if (process.env.ULTIMATE !== 'true') {
        it('should confirm but not relay message from blocked contract', async () => {
          const newValue = 4

          const initialValue = await foreignBox.methods.value().call()
          assert(!toBN(initialValue).eq(toBN(newValue)), 'initial value should be different from new value')

          const signatures = await homeBridge.getPastEvents('SignedForUserRequest', {
            fromBlock: 0,
            toBlock: 'latest'
          })

          await blockHomeBox.methods
            .setValueOnOtherNetwork(newValue, amb.home, amb.foreignBox)
            .send({
              from: user.address,
              gas: '400000'
            })
            .catch(e => {
              console.error(e)
            })

          await delay(5000)

          const newSignatures = await homeBridge.getPastEvents('SignedForUserRequest', {
            fromBlock: 0,
            toBlock: 'latest'
          })

          assert(
            newSignatures.length === signatures.length + requiredSignatures,
            `Incorrect amount of signatures submitted, got ${newSignatures.length}, expected ${signatures.length +
              requiredSignatures}`
          )

          const value = await foreignBox.methods.value().call()
          assert(!toBN(value).eq(toBN(newValue)), 'Message should not be relayed by oracle automatically')
        })
      }

      it('should confirm but not relay message from manual lane', async () => {
        const newValue = 5

        const initialValue = await foreignBox.methods.value().call()
        assert(!toBN(initialValue).eq(toBN(newValue)), 'initial value should be different from new value')

        const signatures = await homeBridge.getPastEvents('SignedForUserRequest', {
          fromBlock: 0,
          toBlock: 'latest'
        })

        await homeBox.methods
          .setValueOnOtherNetworkUsingManualLane(newValue, amb.home, amb.foreignBox)
          .send({
            from: user.address,
            gas: '400000'
          })
          .catch(e => {
            console.error(e)
          })

        await delay(10000)

        const newSignatures = await homeBridge.getPastEvents('SignedForUserRequest', {
          fromBlock: 0,
          toBlock: 'latest'
        })

        assert(
          newSignatures.length === signatures.length + requiredSignatures,
          `Incorrect amount of signatures submitted, got ${newSignatures.length}, expected ${signatures.length +
            requiredSignatures}`
        )

        const value = await foreignBox.methods.value().call()
        assert(!toBN(value).eq(toBN(newValue)), 'Message should not be relayed by oracle automatically')
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

        // check that value changed and balance decreased
        await uniformRetry(async retry => {
          const value = await homeBox.methods.value().call()
          if (!toBN(value).eq(toBN(newValue))) {
            retry()
          }
        })
      })
    })
  })
})
