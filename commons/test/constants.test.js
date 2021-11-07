const { expect } = require('chai')
const { BRIDGE_MODES } = require('../constants')

describe('constants', () => {
  it('should contain correct number of bridge types', () => {
    expect(Object.keys(BRIDGE_MODES).length).to.be.equal(3)
  })
})
