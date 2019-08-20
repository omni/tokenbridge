const assert = require('assert')
const axios = require('axios')
const Web3 = require('web3')
const shell = require('shelljs')
const { nativeToErcBridge, user, homeRPC, foreignRPC } = require('../../e2e-commons/constants.json')
const { generateNewBlock } = require('../../e2e-commons/utils')

const baseUrl = nativeToErcBridge.monitor
const HOME_BRIDGE_ADDRESS = nativeToErcBridge.home
const homeWeb3 = new Web3(new Web3.providers.HttpProvider(homeRPC.URL))
const foreignWeb3 = new Web3(new Web3.providers.HttpProvider(foreignRPC.URL))
homeWeb3.eth.accounts.wallet.add(user.privateKey)
foreignWeb3.eth.accounts.wallet.add(user.privateKey)

describe('NATIVE TO ERC', () => {
  let data

  before(async () => {
    ;({ data } = await axios.get(`${baseUrl}`))
  })

  it('balance', () => assert(parseInt(data.home.balance, 10) >= 0))
  it('should contain totalSupply', () => assert(data.foreign.totalSupply === '0'))
})

describe.only('NATIVE TO ERC with changing state of contracts', () => {
  let data

  before(async () => {
    ;({ data } = await axios.get(`${baseUrl}`))
  })

  it('should change balanceDiff', async () => {
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
    // await generateNewBlock(homeWeb3, user.address)

    console.log('first should be zero...')
    assert(data.balanceDiff === 0)

    console.log('starting check all')
    shell.exec('docker exec e2e-commons_monitor_1 yarn check-all')
    console.log('check all completed')

    ;({ data } = await axios.get(`${baseUrl}`))

    console.log('should not be zero...')
    assert(data.balanceDiff !== 0)
  })
})
