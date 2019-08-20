const assert = require('assert')
const axios = require('axios')
const { ercToNativeBridge, user, foreignRPC } = require('../../e2e-commons/constants.json')
const { checkAll, sendTokens } = require('../utils')

const baseUrl = ercToNativeBridge.monitor

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
    await sendTokens(foreignRPC.URL, user, ercToNativeBridge.foreignToken, ercToNativeBridge.foreign)
    checkAll()
    ;({ data } = await axios.get(`${baseUrl}`))
    assert(data.balanceDiff !== 0)
  })
})
