const assert = require('assert')
const axios = require('axios')
const { ercToErcBridge, user, foreignRPC, validator } = require('../../e2e-commons/constants.json')
const { waitUntil, sendTokens, addValidator } = require('../utils')

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
    assert((await axios.get(`${baseUrl}`)).data.balanceDiff === 0)
    assert((await axios.get(`${baseUrl}/validators`)).data.validatorsMatch === true)
  })

  it('should change balanceDiff', async () => {
    await sendTokens(foreignRPC.URL, user, ercToErcBridge.foreignToken, ercToErcBridge.foreign)

    await waitUntil(async () => {
      ;({ data } = await axios.get(`${baseUrl}`))
      return data.balanceDiff !== 0
    })
  })

  it('should change validatorsMatch', async () => {
    await addValidator(foreignRPC.URL, validator, ercToErcBridge.foreign)
    await waitUntil(async () => {
      ;({ data } = await axios.get(`${baseUrl}/validators`))
      return data.validatorsMatch === false
    })
  })
})
