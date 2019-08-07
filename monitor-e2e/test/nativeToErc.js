const assert = require('assert')
const axios = require('axios')

const types = [{ description: 'NATIVE TO ERC', baseUrl: 'http://monitor:3010' }]

types.forEach(type => {
  describe(type.description, () => {
    let data

    before(async () => {
      ;({ data } = await axios.get(`${type.baseUrl}`))
    })

    it('balance', () => assert(parseInt(data.home.balance, 10) >= 0))
    it('should contain totalSupply', () => assert(data.foreign.totalSupply === '0'))
  })
})
