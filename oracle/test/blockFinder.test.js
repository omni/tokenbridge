const { expect } = require('chai')
const makeBlockFinder = require('../src/services/blockFinder')

const mockBlock = n => ({ timestamp: n > 500 ? n * 10 : n + 4500, number: n })
const latestBlock = mockBlock(1000)
const web3Mock = {
  eth: {
    async getBlock(n) {
      return n === 'latest' ? latestBlock : mockBlock(n)
    }
  }
}

describe('blockFinder', () => {
  it('get recent blocks', async () => {
    const blockFinder = await makeBlockFinder('test', web3Mock)

    expect(await blockFinder(10000, latestBlock)).to.eql(latestBlock)
    expect(await blockFinder(9999, latestBlock)).to.eql(mockBlock(999))
    expect(await blockFinder(9995, latestBlock)).to.eql(mockBlock(999))
    expect(await blockFinder(9991, latestBlock)).to.eql(mockBlock(999))
    expect(await blockFinder(9990, latestBlock)).to.eql(mockBlock(999))
    expect(await blockFinder(9989, latestBlock)).to.eql(mockBlock(998))
    expect(await blockFinder(9981, latestBlock)).to.eql(mockBlock(998))
  })

  it('get older blocks', async () => {
    const blockFinder = await makeBlockFinder('test', web3Mock)

    expect(await blockFinder(7500, latestBlock)).to.eql(mockBlock(750))
    expect(await blockFinder(7497, latestBlock)).to.eql(mockBlock(749))
    expect(await blockFinder(7511, latestBlock)).to.eql(mockBlock(751))
  })

  it('get ancient blocks with different time period', async () => {
    const blockFinder = await makeBlockFinder('test', web3Mock)

    expect(await blockFinder(4600, latestBlock)).to.eql(mockBlock(100))
    expect(await blockFinder(4601, latestBlock)).to.eql(mockBlock(101))
    expect(await blockFinder(4602, latestBlock)).to.eql(mockBlock(102))
  })
})
