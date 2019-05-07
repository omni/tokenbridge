const path = require('path')
const Web3 = require('web3')
const assert = require('assert')
const promiseRetry = require('promise-retry')
const { user } = require('../constants.json')
const { generateNewBlock } = require('../utils/utils')

const abisDir = path.join(__dirname, '..', 'submodules/poa-bridge-contracts/build/contracts')

const homeWeb3 = new Web3(new Web3.providers.HttpProvider('http://parity1:8545'))
const foreignWeb3 = new Web3(new Web3.providers.HttpProvider('http://parity2:8545'))

const HOME_BRIDGE_ADDRESS = '0x488Af810997eD1730cB3a3918cD83b3216E6eAda'
const FOREIGN_BRIDGE_ADDRESS = '0x488Af810997eD1730cB3a3918cD83b3216E6eAda'

const { toBN } = foreignWeb3.utils

homeWeb3.eth.accounts.wallet.add(user.privateKey)
foreignWeb3.eth.accounts.wallet.add(user.privateKey)

const tokenAbi = require(path.join(abisDir, 'ERC677BridgeToken.json')).abi
const erc20Token = new foreignWeb3.eth.Contract(
  tokenAbi,
  '0x3C665A31199694Bf723fD08844AD290207B5797f'
)

describe('erc to native', () => {
  it('should convert tokens in foreign to coins in home', async () => {
    const balance = await erc20Token.methods.balanceOf(user.address).call()
    const originalBalanceOnHome = await homeWeb3.eth.getBalance(user.address)
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
      const balance = await homeWeb3.eth.getBalance(user.address)
      if (toBN(balance).lte(toBN(originalBalanceOnHome))) {
        retry()
      }
    })
  })
  it('should convert coins in home to tokens in foreign', async () => {
    const originalBalance = await erc20Token.methods.balanceOf(user.address).call()

    // check that account has tokens in home chain
    const balance = await homeWeb3.eth.getBalance(user.address)
    assert(!toBN(balance).isZero(), 'Account should have tokens')

    // send transaction to home bridge
    const depositTx = await homeWeb3.eth.sendTransaction({
      from: user.address,
      to: HOME_BRIDGE_ADDRESS,
      gasPrice: '1',
      gas: '1000000',
      value: homeWeb3.utils.toWei('0.01')
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
