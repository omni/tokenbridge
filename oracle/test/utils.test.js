const sinon = require('sinon')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const BigNumber = require('bignumber.js')
const proxyquire = require('proxyquire')
const { addExtraGas, syncForEach } = require('../src/utils/utils')

chai.use(chaiAsPromised)
const { expect } = chai

describe('utils', () => {
  describe('addExtraGas', () => {
    it('should return a BigNumber', () => {
      const result = addExtraGas(100, 0.25)

      expect(BigNumber.isBigNumber(result)).to.equal(true)
    })

    it('should work with numbers', () => {
      const result = addExtraGas(100, 0.25)

      expect(result.toString()).to.equal('125')
    })

    it('should work with BigNumbers', () => {
      const result = addExtraGas(new BigNumber(100), 0.25)

      expect(result.toString()).to.equal('125')
    })

    it('should accept factors bigger than 1', () => {
      const result = addExtraGas(new BigNumber(100), 1.25)

      expect(result.toString()).to.equal('225')
    })
  })

  describe('checkHTTPS', () => {
    let utils
    const logger = { warn: sinon.stub() }
    beforeEach(() => {
      logger.warn.reset()
      utils = proxyquire('../src/utils/utils', { '../services/logger': logger })
    })

    it('should do nothing if HTTP is allowed and the URL is https', () => {
      utils.checkHTTPS('yes', logger)('home')('https://www.google.com')
      expect(logger.warn.called).to.equal(false)
    })

    it('should emit a warning if HTTP is allowed and the URL is http', () => {
      utils.checkHTTPS('yes', logger)('home')('http://www.google.com')
      expect(logger.warn.called).to.equal(true)
    })

    it('should do nothing if HTTP is not allowed and the URL is https', () => {
      utils.checkHTTPS('no', logger)('home')('https://www.google.com')
      expect(logger.warn.called).to.equal(false)
    })

    it('should throw an error if HTTP is not allowed and the URL is http', () => {
      expect(() => utils.checkHTTPS('no', logger)('home')('http://www.google.com')).to.throw()
    })
  })

  describe('syncForEach', () => {
    it('should execute callback sequentially', async () => {
      const xs = []
      await syncForEach(
        [1, 2, 3],
        x =>
          new Promise(resolve => {
            xs.push(x)
            resolve()
          })
      )

      expect(xs).to.deep.equal([1, 2, 3])
    })

    it('should receive the index and the full array', async () => {
      const xs = []
      const is = []
      const arrays = []
      await syncForEach(
        [1, 2, 3],
        (x, i, array) =>
          new Promise(resolve => {
            xs.push(x)
            is.push(i)
            arrays.push(array)
            resolve()
          })
      )

      expect(xs).to.deep.equal([1, 2, 3])
      expect(is).to.deep.equal([0, 1, 2])
      expect(arrays).to.deep.equal([[1, 2, 3], [1, 2, 3], [1, 2, 3]])
    })

    it('should fail and stop when the callback fails', () => {
      const xs = []
      const promise = syncForEach(
        [1, 2, 3],
        x =>
          new Promise((resolve, reject) => {
            if (x === 2) {
              return reject()
            }

            xs.push(x)
            return resolve()
          })
      )

      return expect(promise).to.be.rejected.then(() => {
        expect(xs).to.deep.equal([1])
      })
    })

    it('should work with an empty array', () => {
      const xs = []
      const promise = syncForEach(
        [],
        x =>
          new Promise(resolve => {
            xs.push(x)
            return resolve()
          })
      )

      return expect(promise).to.be.fulfilled.then(() => {
        expect(xs).to.deep.equal([])
      })
    })
  })
})
