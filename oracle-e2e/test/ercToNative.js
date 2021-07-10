const Web3 = require('web3')
const assert = require('assert')
const {
  user,
  secondUser,
  blockedUser,
  validator,
  ercToNativeBridge,
  homeRPC,
  foreignRPC
} = require('../../e2e-commons/constants.json')
const { ERC20_ABI, FOREIGN_ERC_TO_NATIVE_ABI, HOME_ERC_TO_NATIVE_ABI } = require('../../commons')
const { uniformRetry, sleep } = require('../../e2e-commons/utils')
const { setRequiredSignatures } = require('./utils')

const homeWeb3 = new Web3(new Web3.providers.HttpProvider(homeRPC.URL))
const foreignWeb3 = new Web3(new Web3.providers.HttpProvider(foreignRPC.URL))

const COMMON_HOME_BRIDGE_ADDRESS = ercToNativeBridge.home
const COMMON_FOREIGN_BRIDGE_ADDRESS = ercToNativeBridge.foreign

const { toBN } = foreignWeb3.utils

homeWeb3.eth.accounts.wallet.add(user.privateKey)
homeWeb3.eth.accounts.wallet.add(blockedUser.privateKey)
homeWeb3.eth.accounts.wallet.add(validator.privateKey)
foreignWeb3.eth.accounts.wallet.add(user.privateKey)
foreignWeb3.eth.accounts.wallet.add(validator.privateKey)

const erc20Token = new foreignWeb3.eth.Contract(ERC20_ABI, ercToNativeBridge.foreignToken)
const foreignBridge = new foreignWeb3.eth.Contract(FOREIGN_ERC_TO_NATIVE_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
const homeBridge = new homeWeb3.eth.Contract(HOME_ERC_TO_NATIVE_ABI, COMMON_HOME_BRIDGE_ADDRESS)

describe('erc to native', () => {
  before(async () => {
    if (process.env.ULTIMATE === 'true') {
      return
    }
    console.log('Calling setRequiredSignatures(2)')

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
  })
  it('should convert tokens in foreign to coins in home', async () => {
    const balance = await erc20Token.methods.balanceOf(user.address).call()
    const originalBalanceOnHome = await homeWeb3.eth.getBalance(user.address)
    const initialBalanceSecondUser = await homeWeb3.eth.getBalance(secondUser.address)
    assert(!toBN(balance).isZero(), 'Account should have tokens')

    // approve tokens to foreign bridge
    await erc20Token.methods
      .approve(COMMON_FOREIGN_BRIDGE_ADDRESS, homeWeb3.utils.toWei('0.01'))
      .send({
        from: user.address,
        gas: '1000000'
      })
      .catch(e => {
        console.error(e)
      })

    // call bridge method to transfer tokens to a different recipient
    await foreignBridge.methods
      .relayTokens(secondUser.address, homeWeb3.utils.toWei('0.01'))
      .send({
        from: user.address,
        gas: '1000000'
      })
      .catch(e => {
        console.error(e)
      })

    // check that balance increases
    await uniformRetry(async retry => {
      const balance = await homeWeb3.eth.getBalance(user.address)
      const secondUserbalance = await homeWeb3.eth.getBalance(secondUser.address)
      assert(toBN(balance).lte(toBN(originalBalanceOnHome)), 'User balance should be the same')
      if (toBN(secondUserbalance).lte(toBN(initialBalanceSecondUser))) {
        retry()
      }
    })

    const transferValue = homeWeb3.utils.toWei('0.05')

    // transfer that should not be processed by the filter
    await erc20Token.methods.transfer(secondUser.address, transferValue).send({ from: user.address, gas: 100000 })
    // send tokens to foreign bridge
    await erc20Token.methods
      .transfer(COMMON_FOREIGN_BRIDGE_ADDRESS, transferValue)
      .send({
        from: user.address,
        gas: '1000000'
      })
      .catch(e => {
        console.error(e)
      })

    // check that balance increases
    await uniformRetry(async retry => {
      const balance = await homeWeb3.eth.getBalance(user.address)
      if (toBN(balance).lte(toBN(originalBalanceOnHome))) {
        retry()
      } else {
        assert(
          toBN(balance).eq(toBN(originalBalanceOnHome).add(toBN(transferValue))),
          'User balance should be increased only by second transfer'
        )
      }
    })
  })
  it('should convert coins in home to tokens in foreign', async () => {
    const originalBalance = await erc20Token.methods.balanceOf(user.address).call()

    // check that account has tokens in home chain
    const balance = await homeWeb3.eth.getBalance(user.address)
    assert(!toBN(balance).isZero(), 'Account should have tokens')

    // send transaction to home bridge
    await homeWeb3.eth.sendTransaction({
      from: user.address,
      to: COMMON_HOME_BRIDGE_ADDRESS,
      gasPrice: '1',
      gas: '1000000',
      value: homeWeb3.utils.toWei('0.01')
    })

    // check that balance increases
    await uniformRetry(async retry => {
      const balance = await erc20Token.methods.balanceOf(user.address).call()
      if (toBN(balance).lte(toBN(originalBalance))) {
        retry()
      }
    })
  })
  // allowance/block lists files are not mounted to the host during the ultimate test
  if (process.env.ULTIMATE !== 'true') {
    it('should not process transaction from blocked users', async () => {
      const originalBalance1 = await erc20Token.methods.balanceOf(user.address).call()
      const originalBalance2 = await erc20Token.methods.balanceOf(blockedUser.address).call()

      // check that account has tokens in home chain
      const balance1 = await homeWeb3.eth.getBalance(user.address)
      const balance2 = await homeWeb3.eth.getBalance(blockedUser.address)
      assert(!toBN(balance1).isZero(), 'Account should have tokens')
      assert(!toBN(balance2).isZero(), 'Account should have tokens')

      // send transaction to home bridge
      await homeWeb3.eth.sendTransaction({
        from: user.address,
        to: COMMON_HOME_BRIDGE_ADDRESS,
        gasPrice: '1',
        gas: '1000000',
        value: homeWeb3.utils.toWei('0.01')
      })

      // send transaction to home bridge
      await homeWeb3.eth.sendTransaction({
        from: blockedUser.address,
        to: COMMON_HOME_BRIDGE_ADDRESS,
        gasPrice: '1',
        gas: '1000000',
        value: homeWeb3.utils.toWei('0.01')
      })

      // check that balance increases
      await uniformRetry(async retry => {
        const balance = await erc20Token.methods.balanceOf(user.address).call()
        if (toBN(balance).lte(toBN(originalBalance1))) {
          retry()
        }
      })

      await sleep(3000)

      const balance = await erc20Token.methods.balanceOf(blockedUser.address).call()
      assert(
        toBN(balance).eq(toBN(originalBalance2)),
        'Bridge should not process collected signatures from blocked user'
      )
    })
  }
})
