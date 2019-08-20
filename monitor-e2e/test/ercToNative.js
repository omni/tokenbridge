const assert = require('assert')
const axios = require('axios')
const Web3 = require('web3')
const { ercToNativeBridge, user, homeRPC, foreignRPC } = require('../../e2e-commons/constants.json')
const { checkAll, sendEther } = require('../utils')
const { ERC677_BRIDGE_TOKEN_ABI } = require('../../commons')

const foreignWeb3 = new Web3(new Web3.providers.HttpProvider(foreignRPC.URL))
const baseUrl = ercToNativeBridge.monitor
foreignWeb3.eth.accounts.wallet.add(user.privateKey)
const erc20Token = new foreignWeb3.eth.Contract(ERC677_BRIDGE_TOKEN_ABI, ercToNativeBridge.foreignToken)
const FOREIGN_BRIDGE_ADDRESS = ercToNativeBridge.foreign

describe('ERC TO NATIVE', () => {
  let data

  before(async () => {
    ;({ data } = await axios.get(`${baseUrl}`))
  })

  it('balance', () => assert(parseInt(data.foreign.erc20Balance, 10) >= 0))
  it('should contain totalSupply', () => assert(data.home.totalSupply === '0'))
})

describe('ERC TO NATIVE with changing state of contracts', () => {
  let data

  before(async () => {
    ;({ data } = await axios.get(`${baseUrl}`))
    assert(data.balanceDiff === 0)
  })

  it('should change balanceDiff', async () => {
    await erc20Token.methods.transfer(FOREIGN_BRIDGE_ADDRESS, foreignWeb3.utils.toWei('0.01')).send({
      from: user.address,
      gas: '1000000'
    })

    checkAll()
    ;({ data } = await axios.get(`${baseUrl}`))
    assert(data.balanceDiff !== 0)
  })

  it('should change balanceDiff', async () => {
    await sendEther(homeRPC.URL, user, ercToNativeBridge.home)
    checkAll()
    ;({ data } = await axios.get(`${baseUrl}`))
    assert(data.balanceDiff !== 0)
  })

  it('should change balanceDiff', async () => {
    await sendEther(foreignRPC.URL, user, ercToNativeBridge.foreign)
    checkAll()
    ;({ data } = await axios.get(`${baseUrl}`))
    assert(data.balanceDiff !== 0)
  })
})
