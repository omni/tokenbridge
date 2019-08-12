const assert = require('assert')
const axios = require('axios')

// TODO: Move to e2e-commons constants!
const baseUrl = 'http://monitor-erc20-native:3012'

describe('ERC TO NATIVE', () => {
  let data

  before(async () => {
    ;({ data } = await axios.get(`${baseUrl}`))
  })

  it('balance', () => assert(parseInt(data.foreign.erc20Balance, 10) >= 0))
  it('should contain totalSupply', () => assert(data.home.totalSupply === '0'))
})
