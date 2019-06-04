const path = require('path')
const Web3 = require('web3')
const assert = require('assert')
const promiseRetry = require('promise-retry')
const { user, ercToErcBridge, homeRPCURL, foreignRPCURL } = require('../../e2e-commons/constants.json')
const { contractsPath } = require('../config.json')
const { generateNewBlock } = require('../../e2e-commons/utils')

const abisDir = path.join(__dirname, '..', contractsPath, 'build/contracts')

const homeWeb3 = new Web3(new Web3.providers.HttpProvider(homeRPCURL))
const foreignWeb3 = new Web3(new Web3.providers.HttpProvider(foreignRPCURL))

const HOME_BRIDGE_ADDRESS = ercToErcBridge.home
const FOREIGN_BRIDGE_ADDRESS = ercToErcBridge.foreign

const { toBN } = foreignWeb3.utils

homeWeb3.eth.accounts.wallet.add(user.privateKey)
foreignWeb3.eth.accounts.wallet.add(user.privateKey)

const tokenAbi = require(path.join(abisDir, 'ERC677BridgeToken.json')).abi
const erc20Token = new foreignWeb3.eth.Contract(
  tokenAbi,
  ercToErcBridge.foreignToken
)
const erc677Token = new homeWeb3.eth.Contract(
  tokenAbi,
  ercToErcBridge.homeToken
)

describe('erc to erc', () => {
  it('should convert tokens in foreign to tokens in home', async () => {
    const balance = await erc20Token.methods.balanceOf(user.address).call()
    assert(!toBN(balance).isZero(), 'Account should have tokens')

    // send tokens to foreign bridge
    await erc20Token.methods
      .transfer(FOREIGN_BRIDGE_ADDRESS, homeWeb3.utils.toWei('0.01'))
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
      .transferAndCall(HOME_BRIDGE_ADDRESS, homeWeb3.utils.toWei('0.01'), '0x')
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
