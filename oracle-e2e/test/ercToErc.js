const Web3 = require('web3')
const assert = require('assert')
const promiseRetry = require('promise-retry')
const { user, secondUser, ercToErcBridge, homeRPC, foreignRPC } = require('../../e2e-commons/constants.json')
const { ERC677_BRIDGE_TOKEN_ABI, FOREIGN_ERC_TO_NATIVE_ABI } = require('../../commons')
const { generateNewBlock } = require('../../e2e-commons/utils')

const homeWeb3 = new Web3(new Web3.providers.HttpProvider(homeRPC.URL))
const foreignWeb3 = new Web3(new Web3.providers.HttpProvider(foreignRPC.URL))

const COMMON_HOME_BRIDGE_ADDRESS = ercToErcBridge.home
const COMMON_FOREIGN_BRIDGE_ADDRESS = ercToErcBridge.foreign

const { toBN } = foreignWeb3.utils

homeWeb3.eth.accounts.wallet.add(user.privateKey)
foreignWeb3.eth.accounts.wallet.add(user.privateKey)

const erc20Token = new foreignWeb3.eth.Contract(ERC677_BRIDGE_TOKEN_ABI, ercToErcBridge.foreignToken)
const foreignBridge = new foreignWeb3.eth.Contract(FOREIGN_ERC_TO_NATIVE_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
const erc677Token = new homeWeb3.eth.Contract(ERC677_BRIDGE_TOKEN_ABI, ercToErcBridge.homeToken)

describe('erc to erc', () => {
  it('should convert tokens in foreign to tokens in home', async () => {
    const balance = await erc20Token.methods.balanceOf(user.address).call()
    assert(!toBN(balance).isZero(), 'Account should have tokens')

    const firstTransferValue = homeWeb3.utils.toWei('0.01')

    // approve tokens to foreign bridge
    await erc20Token.methods
      .approve(COMMON_FOREIGN_BRIDGE_ADDRESS, firstTransferValue)
      .send({
        from: user.address,
        gas: '1000000'
      })
      .catch(e => {
        console.error(e)
      })

    // call bridge method to transfer tokens to a different recipient
    await foreignBridge.methods
      .relayTokens(secondUser.address, firstTransferValue)
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

    // check that balance increases
    await promiseRetry(async retry => {
      const balance = await erc677Token.methods.balanceOf(user.address).call()
      const recipientBalance = await erc677Token.methods.balanceOf(secondUser.address).call()
      assert(toBN(balance).isZero(), 'User balance should be the same')
      if (toBN(recipientBalance).isZero()) {
        retry()
      }
    })

    const secondTransferValue = homeWeb3.utils.toWei('0.05')

    // send tokens to foreign bridge
    await erc20Token.methods
      .transfer(COMMON_FOREIGN_BRIDGE_ADDRESS, secondTransferValue)
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

    // check that balance increases
    await promiseRetry(async retry => {
      const balance = await erc677Token.methods.balanceOf(user.address).call()
      if (toBN(balance).isZero()) {
        retry()
      } else {
        assert(toBN(balance).eq(toBN(secondTransferValue)), 'User balance should be increased only by second transfer')
      }
    })
  })
  it('should convert tokens in home to tokens in foreign', async () => {
    const originalBalance = await erc20Token.methods.balanceOf(user.address).call()

    // check that account has tokens in home chain
    const balance = await erc677Token.methods.balanceOf(user.address).call()
    assert(!toBN(balance).isZero(), 'Account should have tokens')

    // send transaction to home bridge
    const depositTx = await erc677Token.methods
      .transferAndCall(COMMON_HOME_BRIDGE_ADDRESS, homeWeb3.utils.toWei('0.01'), '0x')
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
        if (lastBlockNumber >= depositTx.blockNumber + 2) {
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

    // check that balance increases
    await promiseRetry(async retry => {
      const balance = await erc20Token.methods.balanceOf(user.address).call()
      if (toBN(balance).lte(toBN(originalBalance))) {
        retry()
      }
    })
  })
})
