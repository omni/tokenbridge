const assert = require('assert')
const axios = require('axios')
const { ercToNativeBridge, user, foreignRPC, validator } = require('../../e2e-commons/constants.json')
const { waitUntil, sendTokens, addValidator, initializeChaiToken, convertDaiToChai } = require('../utils')

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
    assert((await axios.get(`${baseUrl}`)).data.balanceDiff === 0)
    assert((await axios.get(`${baseUrl}/validators`)).data.validatorsMatch === true)
  })

  it('should change balanceDiff', async () => {
    await sendTokens(foreignRPC.URL, user, ercToNativeBridge.halfDuplexToken, ercToNativeBridge.foreign)

    await waitUntil(async () => {
      ;({ data } = await axios.get(`${baseUrl}`))
      return data.balanceDiff === 0.01 && data.foreign.halfDuplexErc20Balance === '0.01'
    })
  })

  it('should change validatorsMatch', async () => {
    await addValidator(foreignRPC.URL, validator, ercToNativeBridge.foreign)
    await waitUntil(async () => {
      ;({ data } = await axios.get(`${baseUrl}/validators`))
      return data.validatorsMatch === false
    })
  })

  it('should consider chai token balance', async () => {
    await initializeChaiToken(foreignRPC.URL, ercToNativeBridge.foreign)
    await sendTokens(foreignRPC.URL, user, ercToNativeBridge.foreignToken, ercToNativeBridge.foreign)
    await convertDaiToChai(foreignRPC.URL, ercToNativeBridge.foreign)

    await waitUntil(async () => {
      ;({ data } = await axios.get(`${baseUrl}`))
      return data.balanceDiff === 0.02 && data.foreign.investedErc20Balance === '0.01'
    })
  })
})
