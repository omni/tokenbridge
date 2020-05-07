const { expect } = require('chai')
const { BRIDGE_MODES, ERC_TYPES } = require('../constants')

describe('constants', () => {
  it('should contain correct number of bridge types', () => {
    expect(Object.keys(BRIDGE_MODES).length).to.be.equal(7)
  })

  it('should contain correct number of erc types', () => {
    expect(Object.keys(ERC_TYPES).length).to.be.equal(2)
  })
})
