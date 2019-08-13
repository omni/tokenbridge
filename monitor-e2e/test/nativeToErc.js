const assert = require('assert')
const axios = require('axios')
const { nativeToErcBridge } = require('../../e2e-commons/constants.json')

const baseUrl = nativeToErcBridge.monitor

describe('NATIVE TO ERC', () => {
  let data

  before(async () => {
    ;({ data } = await axios.get(`${baseUrl}`))
  })

  it('balance', () => assert(parseInt(data.home.balance, 10) >= 0))
  it('should contain totalSupply', () => assert(data.foreign.totalSupply === '0'))
})
