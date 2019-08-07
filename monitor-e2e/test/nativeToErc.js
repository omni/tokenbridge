const assert = require('assert')
const axios = require('axios')

describe('NATIVE TO ERC', () => {
  describe('balances', async () => {
    let output

    beforeEach(async () => {
      output = await axios.get('http://localhost:3010')
    })

    it('should be ok', () => {
      assert(output === 'lala')
    })
  })

  describe('validators', async () => {})

  describe('eventsStats', async () => {})

  describe('alerts', async () => {})

  it('should work', async () => {
    assert(true)
  })
})
