const assert = require('assert')
const axios = require('axios')
const { ercToErcBridge } = require('../../e2e-commons/constants.json')

const baseUrl = ercToErcBridge.monitor

describe('ERC TO ERC', () => {
  let data

  before(async () => {
    ;({ data } = await axios.get(`${baseUrl}`))
  })

  it('balance', () => assert(parseInt(data.foreign.erc20Balance, 10) >= 0))
  it('should contain totalSupply', () => assert(data.home.totalSupply === '0'))
})
