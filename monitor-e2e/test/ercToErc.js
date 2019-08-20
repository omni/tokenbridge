const assert = require('assert')
const axios = require('axios')
const { ercToErcBridge, user, homeRPC, foreignRPC } = require('../../e2e-commons/constants.json')
const { checkAll, sendEther } = require('../utils')

const baseUrl = ercToErcBridge.monitor

describe('ERC TO ERC', () => {
  let data

  before(async () => {
    ;({ data } = await axios.get(`${baseUrl}`))
  })

  it('balance', () => assert(parseInt(data.foreign.erc20Balance, 10) >= 0))
  it('should contain totalSupply', () => assert(data.home.totalSupply === '0'))
})

describe('ERC TO ERC with changing state of contracts', () => {
  let data

  before(async () => {
    ;({ data } = await axios.get(`${baseUrl}`))
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
