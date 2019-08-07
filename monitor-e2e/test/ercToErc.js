const assert = require('assert')
const axios = require('axios')

const types = [{ description: 'ERC TO ERC', baseUrl: 'http://monitor-erc20:3011' }]

types.forEach(type => {
  describe(type.description, () => {
    let data

    before(async () => {
      ;({ data } = await axios.get(`${type.baseUrl}`))
    })

    it('balance', () => assert(parseInt(data.foreign.erc20Balance, 10) >= 0))
    it('should contain totalSupply', () => assert(data.home.totalSupply === '0'))
  })
})
