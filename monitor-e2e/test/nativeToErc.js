const assert = require('assert')
const axios = require('axios')

// TODO: Move to e2e-commons constants!
const baseUrl = 'http://monitor:3010'

describe('NATIVE TO ERC', () => {
  let data

  before(async () => {
    ;({ data } = await axios.get(`${baseUrl}`))
  })

  it('balance', () => assert(parseInt(data.home.balance, 10) >= 0))
  it('should contain totalSupply', () => assert(data.foreign.totalSupply === '0'))
})
