const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const tryEach = require('../src/utils/tryEach')

chai.use(chaiAsPromised)
const { expect } = chai

describe('tryEach', () => {
  it('should work with the first element', async () => {
    // given
    const array = [1, 2, 3]
    const f = x => (x === 1 ? Promise.resolve(2 * x) : Promise.reject())

    // when
    const [result, index] = await tryEach(array, f)

    // then
    expect(result).to.equal(2)
    expect(index).to.equal(0)
  })

  it('should work with the second element', async () => {
    // given
    const array = [1, 2, 3]
    const f = x => (x === 2 ? Promise.resolve(2 * x) : Promise.reject())

    // when
    const [result, index] = await tryEach(array, f)

    // then
    expect(result).to.equal(4)
    expect(index).to.equal(1)
  })

  it('should work with the last element', async () => {
    // given
    const array = [1, 2, 3]
    const f = x => (x === array[array.length - 1] ? Promise.resolve(2 * x) : Promise.reject())

    // when
    const [result, index] = await tryEach(array, f)

    // then
    expect(result).to.equal(6)
    expect(index).to.equal(2)
  })

  it('should return array with errors if all elements fail', async () => {
    // given
    const array = [1, 2, 3]
    const f = x => Promise.reject(-x) // eslint-disable-line prefer-promise-reject-errors

    // when
    return expect(tryEach(array, f)).to.be.rejected.and.eventually.deep.equal([-1, -2, -3])
  })

  it('should return an empty array if input array is empty', async () => {
    // given
    const array = []
    const f = x => Promise.resolve(x)

    // when
    return expect(tryEach(array, f)).to.be.rejected.and.eventually.deep.equal([])
  })
})
