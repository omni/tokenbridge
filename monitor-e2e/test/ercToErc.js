const assert = require('assert')
const axios = require('axios')
const Web3 = require('web3')
const { ercToErcBridge, user, homeRPC, foreignRPC } = require('../../e2e-commons/constants.json')
const { checkAll, sendEther } = require('../utils')
const { ERC677_BRIDGE_TOKEN_ABI } = require('../../commons')

const baseUrl = ercToErcBridge.monitor
const foreignWeb3 = new Web3(new Web3.providers.HttpProvider(foreignRPC.URL))
foreignWeb3.eth.accounts.wallet.add(user.privateKey)
const erc20Token = new foreignWeb3.eth.Contract(ERC677_BRIDGE_TOKEN_ABI, ercToErcBridge.foreignToken)
const FOREIGN_BRIDGE_ADDRESS = ercToErcBridge.foreign

describe('ERC TO ERC', () => {
  let data

  before(async () => {
    ;({ data } = await axios.get(`${baseUrl}`))
  })

  it('balance', () => assert(parseInt(data.foreign.erc20Balance, 10) >= 0))
  it('should contain totalSupply', () => assert(data.home.totalSupply === '0'))
})

describe.only('ERC TO ERC with changing state of contracts', () => {
  let data

  before(async () => {
    ;({ data } = await axios.get(`${baseUrl}`))
  })

  it.only('should change balanceDiff', async () => {
    await erc20Token.methods.transfer(FOREIGN_BRIDGE_ADDRESS, foreignWeb3.utils.toWei('0.01')).send({
      from: user.address,
      gas: '1000000'
    })

    checkAll()
    ;({ data } = await axios.get(`${baseUrl}`))
    assert(data.balanceDiff !== 0)
  })

  it('should change balanceDiff', async () => {
    assert(data.balanceDiff === 0)
    await sendEther(homeRPC.URL, user, ercToErcBridge.home)
    checkAll()
    ;({ data } = await axios.get(`${baseUrl}`))
    assert(data.balanceDiff !== 0)
  })

  it('should change balanceDiff', async () => {
    assert(data.balanceDiff === 0)
    await sendEther(foreignRPC.URL, user, ercToErcBridge.foreign)
    checkAll()
    ;({ data } = await axios.get(`${baseUrl}`))
    assert(data.balanceDiff !== 0)
  })
})
