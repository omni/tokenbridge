const assert = require('assert')
const axios = require('axios')
const { nativeToErcBridge, user, homeRPC } = require('../../e2e-commons/constants.json')
const { waitUntil, sendEther } = require('../utils')

const baseUrl = nativeToErcBridge.monitor

describe('NATIVE TO ERC', () => {
  let data

  before(async () => {
    ;({ data } = await axios.get(`${baseUrl}`))
  })

  it('balance', () => assert(parseInt(data.home.balance, 10) >= 0))
  it('should contain totalSupply', () => assert(data.foreign.totalSupply === '0'))
})

describe('NATIVE TO ERC with changing state of contracts', () => {
  let data

  before(async () => {
    ;({ data } = await axios.get(`${baseUrl}`))
    assert(data.balanceDiff === 0)
  })

  it('should change balanceDiff', async () => {
    await sendEther(homeRPC.URL, user, nativeToErcBridge.home)

    await waitUntil(async () => {
      ;({ data } = await axios.get(`${baseUrl}`))
      return data.balanceDiff !== 0
    })
  })
})
