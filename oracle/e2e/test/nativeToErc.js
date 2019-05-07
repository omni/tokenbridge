const path = require('path')
const Web3 = require('web3')
const assert = require('assert')
const promiseRetry = require('promise-retry')
const { user, validator, temp } = require('../constants.json')
const { generateNewBlock } = require('../utils/utils')

const abisDir = path.join(__dirname, '..', 'submodules/poa-bridge-contracts/build/contracts')

const homeWeb3 = new Web3(new Web3.providers.HttpProvider('http://parity1:8545'))
const foreignWeb3 = new Web3(new Web3.providers.HttpProvider('http://parity2:8545'))

const HOME_BRIDGE_ADDRESS = '0x32198D570fffC7033641F8A9094FFDCaAEF42624'
const FOREIGN_BRIDGE_ADDRESS = '0x2B6871b9B02F73fa24F4864322CdC78604207769'

const { toBN } = foreignWeb3.utils

homeWeb3.eth.accounts.wallet.add(user.privateKey)
homeWeb3.eth.accounts.wallet.add(validator.privateKey)
homeWeb3.eth.accounts.wallet.add(temp.privateKey)
foreignWeb3.eth.accounts.wallet.add(user.privateKey)
foreignWeb3.eth.accounts.wallet.add(validator.privateKey)
foreignWeb3.eth.accounts.wallet.add(temp.privateKey)

const tokenAbi = require(path.join(abisDir, 'ERC677BridgeToken.json')).abi
const token = new foreignWeb3.eth.Contract(tokenAbi, '0xdbeE25CbE97e4A5CC6c499875774dc7067E9426B')

const sleep = timeout => new Promise(res => setTimeout(res, timeout))

describe('native to erc', () => {
  it('should convert eth in home to tokens in foreign', async () => {
    // check that account has zero tokens in the foreign chain
    const balance = await token.methods.balanceOf(user.address).call()
    assert(toBN(balance).isZero(), 'Account should not have tokens yet')

    // send transaction to home chain
    const depositTx = await homeWeb3.eth.sendTransaction({
      from: user.address,
      to: HOME_BRIDGE_ADDRESS,
      gasPrice: '1',
      gas: '50000',
      value: '1000000000000000000'
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

    // check that account has tokens in the foreign chain
    await promiseRetry(async retry => {
      const balance = await token.methods.balanceOf(user.address).call()
      if (toBN(balance).isZero()) {
        retry()
      }
    })
  })

  it('should convert tokens in foreign to eth in home', async () => {
    const originalBalance = await homeWeb3.eth.getBalance(user.address)

    // send tokens to foreign bridge
    await token.methods
      .transferAndCall(FOREIGN_BRIDGE_ADDRESS, homeWeb3.utils.toWei('0.01'), '0x')
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
      if (toBN(balance).lte(toBN(originalBalance))) {
        retry()
      }
    })
  })

  it('should wait for funds if these are insufficient (Home)', async () => {
    // check that account has zero tokens in the foreign chain
    const originalBalance = toBN(await token.methods.balanceOf(user.address).call())

    // empty validator funds
    await sendAllBalance(homeWeb3, validator.address, temp.address)

    // send transaction to home chain
    const depositTx = await homeWeb3.eth.sendTransaction({
      from: user.address,
      to: HOME_BRIDGE_ADDRESS,
      gasPrice: '1',
      gas: '50000',
      value: '1000000000000000000'
    })

    // Send a Tx to generate a new block
    await generateNewBlock(homeWeb3, user.address)

    // wait two seconds, no new blocks should have been generated
    await sleep(2000)
    const lastBlockNumber = await homeWeb3.eth.getBlockNumber()
    const balance = toBN(await token.methods.balanceOf(user.address).call())
    assert(lastBlockNumber === depositTx.blockNumber + 1, "Shouldn't have emitted a new block")
    assert(originalBalance.eq(balance), "Token balance shouldn't have changed")

    // send funds back to validator
    const sendBalanceBackTx = await sendAllBalance(homeWeb3, temp.address, validator.address)

    // expect Deposit event to be processed
    await promiseRetry(
      async retry => {
        const lastBlockNumber = await homeWeb3.eth.getBlockNumber()
        // check that a new block was created since the last transaction
        if (lastBlockNumber === sendBalanceBackTx.blockNumber + 1) {
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

    // check that token balance was incremented in foreign chain
    await promiseRetry(async retry => {
      const balance = toBN(await token.methods.balanceOf(user.address).call())
      if (!balance.gt(originalBalance)) {
        retry()
      }
    })
  })

  it('should wait for funds if these are insufficient (Foreign)', async () => {
    // get original tokens balance
    const originalBalance = toBN(await token.methods.balanceOf(user.address).call())

    // empty foreign validator funds
    await sendAllBalance(foreignWeb3, validator.address, temp.address)
    const foreignBlockNumber = await foreignWeb3.eth.getBlockNumber()

    // send transaction to home chain
    await homeWeb3.eth.sendTransaction({
      from: user.address,
      to: HOME_BRIDGE_ADDRESS,
      gasPrice: '1',
      gas: '50000',
      value: '1000000000000000000'
    })

    // Send a Tx to generate a new block
    const lastHomeTx = await generateNewBlock(homeWeb3, user.address)

    // wait for the deposit to be processed
    await promiseRetry(
      async retry => {
        const lastBlockNumber = await homeWeb3.eth.getBlockNumber()
        if (lastBlockNumber === lastHomeTx.blockNumber + 1) {
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

    // tokens shouldn't be generated in the foreign chain because the validator doesn't have funds
    await sleep(2000)
    const lastForeignBlockNumber = await foreignWeb3.eth.getBlockNumber()
    assert(lastForeignBlockNumber === foreignBlockNumber, "Shouldn't have emitted a new block")

    // send funds back to validator
    await sendAllBalance(foreignWeb3, temp.address, validator.address)

    // check that account has tokens in the foreign chain
    await promiseRetry(async retry => {
      const balance = toBN(await token.methods.balanceOf(user.address).call())
      if (balance.eq(originalBalance)) {
        retry()
      }
    })
  })
})

async function sendAllBalance(web3, from, to) {
  const balance = await web3.eth.getBalance(from)
  const value = toBN(balance).sub(toBN('21000'))

  return web3.eth.sendTransaction({
    from,
    to,
    value,
    gas: '21000',
    gasPrice: '1'
  })
}
