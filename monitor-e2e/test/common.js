const assert = require('assert')
const axios = require('axios')
const { nativeToErcBridge, ercToErcBridge, ercToNativeBridge } = require('../../e2e-commons/constants.json')

const types = [
  { description: 'NATIVE TO ERC', baseUrl: nativeToErcBridge.monitor },
  { description: 'ERC TO ERC', baseUrl: ercToErcBridge.monitor },
  { description: 'ERC TO NATIVE', baseUrl: ercToNativeBridge.monitor }
]

types.forEach(type => {
  describe(type.description, () => {
    describe('balances', async () => {
      let data

      before(async () => {
        ;({ data } = await axios.get(`${type.baseUrl}`))
      })

      describe('home', async () => {
        it('should contain deposits:', () => assert(data.home.deposits === 0))
        it('should contain withdrawals', () => assert(data.home.withdrawals === 0))
      })

      describe('foreign', async () => {
        it('should contain deposits:', () => assert(data.foreign.deposits === 0))
        it('should contain withdrawals', () => assert(data.foreign.withdrawals === 0))
      })

      describe('general', async () => {
        it('should contain balanceDiff', () => assert(data.balanceDiff === 0))
        it('should contain depositsDiff', () => assert(data.depositsDiff === 0))
        it('should contain withdrawalDiff', () => assert(data.withdrawalDiff === 0))
        it('should contain timeDiff', () => assert(data.timeDiff >= 0))
        it('should contain lastChecked', () => assert(data.lastChecked >= 0))
      })
    })

    describe('validators', async () => {
      let data

      before(async () => {
        ;({ data } = await axios.get(`${type.baseUrl}/validators`))
      })

      it('home', () => assert(typeof data.home.validators === 'object'))
      it('foreign', () => assert(typeof data.foreign.validators === 'object'))
      it('requiredSignaturesMatch', () => assert(data.requiredSignaturesMatch))
      it('validatorsMatch', () => assert(data.validatorsMatch))
      it('lastChecked', () => assert(data.lastChecked >= 0))
      it('timeDiff', () => assert(data.timeDiff >= 0))
      it('homeOk', () => assert(data.homeOk))
      it('foreignOk', () => assert(data.foreignOk))
      it('ok', () => assert(data.ok))
    })

    describe('eventsStats', async () => {
      let data

      before(async () => {
        ;({ data } = await axios.get(`${type.baseUrl}/eventsStats`))
      })

      it('ok', () => assert(data.ok))
      it('lastChecked', () => assert(data.lastChecked >= 0))
      it('timeDiff', () => assert(data.timeDiff >= 0))
      it('onlyInHomeDeposits', () => assert(typeof data.onlyInHomeDeposits === 'object'))
      it('onlyInForeignDeposits', () => assert(typeof data.onlyInForeignDeposits === 'object'))
      it('onlyInHomeWithdrawals', () => assert(typeof data.onlyInHomeWithdrawals === 'object'))
      it('onlyInForeignWithdrawals', () => assert(typeof data.onlyInForeignWithdrawals === 'object'))
    })

    describe('alerts', async () => {
      let data

      before(async () => {
        ;({ data } = await axios.get(`${type.baseUrl}/alerts`))
      })

      it('ok', () => assert(data.ok))
      it('lastChecked', () => assert(data.lastChecked >= 0))
      it('timeDiff', () => assert(data.timeDiff >= 0))
      it('executeSignatures', () => assert(typeof data.executeSignatures === 'object'))
      it('executeAffirmations', () => assert(typeof data.executeAffirmations === 'object'))
    })
  })
})
