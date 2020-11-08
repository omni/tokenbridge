const assert = require('assert')
const axios = require('axios')
const { amb, user, foreignRPC, homeRPC, validator } = require('../../e2e-commons/constants.json')
const { waitUntil, sendAMBMessage, addValidator } = require('../utils')

const baseUrl = amb.monitor

describe('AMB', () => {
  describe('balances', async () => {
    let data

    before(async () => {
      ;({ data } = await axios.get(`${baseUrl}`))
    })

    describe('home', async () => {
      it('should contain toForeign:', () => assert(data.home.toForeign === 0))
      it('should contain fromForeign', () => assert(data.home.fromForeign === 0))
    })

    describe('foreign', async () => {
      it('should contain fromHome:', () => assert(data.foreign.fromHome === 0))
      it('should contain toHome', () => assert(data.foreign.toHome === 0))
    })

    describe('general', async () => {
      it('should contain fromHomeToForeignDiff', () => assert(data.fromHomeToForeignDiff === 0))
      it('should contain fromHomeToForeignPBUDiff', () => assert(data.fromHomeToForeignPBUDiff === 0))
      it('should contain fromForeignToHomeDiff', () => assert(data.fromForeignToHomeDiff === 0))
      it('should contain lastChecked', () => assert(data.lastChecked >= 0))
      it('should contain timeDiff', () => assert(data.timeDiff >= 0))
      it('should contain lastChecked', () => assert(data.lastChecked >= 0))
    })
  })
  describe('validators', async () => {
    let data

    before(async () => {
      ;({ data } = await axios.get(`${baseUrl}/validators`))
    })

    it('home', () => {
      assert(typeof data.home.validators === 'object')
      assert(data.home.validators[validator.address].balance > 0)
      assert(data.home.validators[validator.address].leftTx > 0)
      assert(data.home.validators[validator.address].gasPrice > 0)
    })

    it('foreign', () => {
      assert(typeof data.foreign.validators === 'object')
      assert(data.foreign.validators[validator.address].balance > 0)
      assert(data.foreign.validators[validator.address].leftTx > 0)
      assert(data.foreign.validators[validator.address].gasPrice > 0)
    })

    it('requiredSignaturesMatch', () => assert(data.requiredSignaturesMatch, 1))
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
      ;({ data } = await axios.get(`${baseUrl}/eventsStats`))
    })

    it('ok', () => assert(data.ok))
    it('lastChecked', () => assert(data.lastChecked >= 0))
    it('timeDiff', () => assert(data.timeDiff >= 0))
    it('home-deliveredMsgNotProcessedInForeign', () =>
      assert(typeof data.home.deliveredMsgNotProcessedInForeign === 'object'))
    it('home-processedMsgNotDeliveredInForeign', () =>
      assert(typeof data.home.processedMsgNotDeliveredInForeign === 'object'))
    it('foreign-deliveredMsgNotProcessedInHome', () =>
      assert(typeof data.foreign.deliveredMsgNotProcessedInHome === 'object'))
    it('foreign-processedMsgNotDeliveredInHome', () =>
      assert(typeof data.foreign.processedMsgNotDeliveredInHome === 'object'))
  })
  describe('alerts', async () => {
    let data

    before(async () => {
      ;({ data } = await axios.get(`${baseUrl}/alerts`))
    })

    it('ok', () => assert(data.ok))
    it('lastChecked', () => assert(data.lastChecked >= 0))
    it('timeDiff', () => assert(data.timeDiff >= 0))
    it('executeSignatures', () => assert(typeof data.executeSignatures === 'object'))
    it('executeAffirmations', () => assert(typeof data.executeAffirmations === 'object'))
  })
  describe('changing state of contracts', () => {
    let data

    before(async () => {
      assert((await axios.get(`${baseUrl}/validators`)).data.validatorsMatch === true)
    })

    it('should change fromForeignToHomeDiff', async () => {
      // send message
      await sendAMBMessage(foreignRPC.URL, user, amb.foreignBox, amb.foreign, amb.homeBox)

      await waitUntil(async () => {
        ;({ data } = await axios.get(`${baseUrl}`))
        return data.fromForeignToHomeDiff !== 0
      })
    })
    it('should change fromHomeToForeignDiff', async () => {
      // send message
      await sendAMBMessage(homeRPC.URL, user, amb.homeBox, amb.home, amb.foreignBox)

      await waitUntil(async () => {
        ;({ data } = await axios.get(`${baseUrl}`))
        return data.fromHomeToForeignDiff === 1 && data.fromHomeToForeignPBUDiff === 0
      })
    })
    it('should change fromHomeToForeignPBUDiff', async () => {
      // send message
      await sendAMBMessage(homeRPC.URL, user, amb.homeBox, amb.home, amb.foreignBox, true)

      await waitUntil(async () => {
        ;({ data } = await axios.get(`${baseUrl}`))
        return data.fromHomeToForeignDiff === 1 && data.fromHomeToForeignPBUDiff === 1
      })
    })
    it('should change validatorsMatch', async () => {
      await addValidator(foreignRPC.URL, validator, amb.foreign)
      await waitUntil(async () => {
        ;({ data } = await axios.get(`${baseUrl}/validators`))
        return data.validatorsMatch === false
      })
    })
  })
})
