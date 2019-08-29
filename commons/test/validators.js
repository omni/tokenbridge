const { expect } = require('chai')
const { processValidatorsEvents, parseValidatorEvent } = require('..')

describe('parseValidatorEvent', () => {
  it('should parse ValidatorAdded event from v1', () => {
    // Given
    const event = {
      raw: {
        data: '0x000000000000000000000000cfef0c6bb765321529ffe81507f6d099693cd225',
        topics: ['0xe366c1c0452ed8eec96861e9e54141ebff23c9ec89fe27b996b45f5ec3884987']
      },
      returnValues: {}
    }
    // When
    parseValidatorEvent(event)

    // Then
    expect(event.event).to.be.equal('ValidatorAdded')
    expect(event.returnValues.validator).to.be.equal('0xcfef0c6bb765321529ffe81507f6d099693cd225')
  })
  it('should parse ValidatorAdded event', () => {
    // Given
    const event = {
      raw: {
        data: '0x',
        topics: [
          '0xe366c1c0452ed8eec96861e9e54141ebff23c9ec89fe27b996b45f5ec3884987',
          '0x000000000000000000000000cfef0c6bb765321529ffe81507f6d099693cd225'
        ]
      },
      returnValues: {}
    }
    // When
    parseValidatorEvent(event)

    // Then
    expect(event.event).to.be.equal('ValidatorAdded')
    expect(event.returnValues.validator).to.be.equal('0xcfef0c6bb765321529ffe81507f6d099693cd225')
  })
  it('should parse ValidatorAdded event from rewardableValidators', () => {
    // Given
    const event = {
      raw: {
        data: '0x000000000000000000000000cfef0c6bb765321529ffe81507f6d099693cd225',
        topics: [
          '0x8064a302796c89446a96d63470b5b036212da26bd2debe5bec73e0170a9a5e83',
          '0x000000000000000000000000cfef0c6bb765321529ffe81507f6d099693cd225'
        ]
      },
      returnValues: {}
    }
    // When
    parseValidatorEvent(event)

    // Then
    expect(event.event).to.be.equal('ValidatorAdded')
    expect(event.returnValues.validator).to.be.equal('0xcfef0c6bb765321529ffe81507f6d099693cd225')
  })
  it('should parse ValidatorRemoved event', () => {
    // Given
    const event = {
      raw: {
        data: '0x',
        topics: [
          '0xe1434e25d6611e0db941968fdc97811c982ac1602e951637d206f5fdda9dd8f1',
          '0x000000000000000000000000cfef0c6bb765321529ffe81507f6d099693cd225'
        ]
      },
      returnValues: {}
    }
    // When
    parseValidatorEvent(event)

    // Then
    expect(event.event).to.be.equal('ValidatorRemoved')
    expect(event.returnValues.validator).to.be.equal('0xcfef0c6bb765321529ffe81507f6d099693cd225')
  })
  it('should parse ValidatorRemoved event from v1', () => {
    // Given
    const event = {
      raw: {
        data: '0x000000000000000000000000cfef0c6bb765321529ffe81507f6d099693cd225',
        topics: ['0xe1434e25d6611e0db941968fdc97811c982ac1602e951637d206f5fdda9dd8f1']
      },
      returnValues: {}
    }
    // When
    parseValidatorEvent(event)

    // Then
    expect(event.event).to.be.equal('ValidatorRemoved')
    expect(event.returnValues.validator).to.be.equal('0xcfef0c6bb765321529ffe81507f6d099693cd225')
  })
})
describe('processValidatorsEvents', () => {
  it('should return validator list from raw events', () => {
    // Given
    const events = [
      {
        // Add v1 event
        raw: {
          data: '0x000000000000000000000000cfef0c6bb765321529ffe81507f6d099693cd225',
          topics: ['0xe366c1c0452ed8eec96861e9e54141ebff23c9ec89fe27b996b45f5ec3884987']
        },
        returnValues: {}
      },
      {
        // Add v1 event
        raw: {
          data: '0x000000000000000000000000Cbd25A2a5708051747a052dBB1b291865Fc0e474',
          topics: ['0xe366c1c0452ed8eec96861e9e54141ebff23c9ec89fe27b996b45f5ec3884987']
        },
        returnValues: {}
      },
      {
        // Remove v1 event
        raw: {
          data: '0x000000000000000000000000cfef0c6bb765321529ffe81507f6d099693cd225',
          topics: ['0xe1434e25d6611e0db941968fdc97811c982ac1602e951637d206f5fdda9dd8f1']
        },
        returnValues: {}
      },
      {
        // Add event
        raw: {
          data: '0x',
          topics: [
            '0xe366c1c0452ed8eec96861e9e54141ebff23c9ec89fe27b996b45f5ec3884987',
            '0x000000000000000000000000FE365A92Bc01425441dE76D8EDA48496B64446FB'
          ]
        },
        returnValues: {}
      },
      {
        // Add event
        raw: {
          data: '0x',
          topics: [
            '0xe366c1c0452ed8eec96861e9e54141ebff23c9ec89fe27b996b45f5ec3884987',
            '0x000000000000000000000000Bac68A86Cf596E3b124781E0bdbC47bb458bec62'
          ]
        },
        returnValues: {}
      },
      {
        // Remove event
        raw: {
          data: '0x',
          topics: [
            '0xe1434e25d6611e0db941968fdc97811c982ac1602e951637d206f5fdda9dd8f1',
            '0x000000000000000000000000FE365A92Bc01425441dE76D8EDA48496B64446FB'
          ]
        },
        returnValues: {}
      },
      {
        // Add rewardable event
        raw: {
          data: '0x0000000000000000000000000066938BBE9b31D44DFa8e27A1d675A545DF6ed5',
          topics: [
            '0x8064a302796c89446a96d63470b5b036212da26bd2debe5bec73e0170a9a5e83',
            '0x000000000000000000000000f4BEF13F9f4f2B203FAF0C3cBbaAbe1afE056955'
          ]
        },
        returnValues: {}
      }
    ]

    // When
    const validatorList = processValidatorsEvents(events)

    // Then
    expect(validatorList.length).to.be.equal(3)
    expect(validatorList[0]).to.be.equal('0xCbd25A2a5708051747a052dBB1b291865Fc0e474')
    expect(validatorList[1]).to.be.equal('0xBac68A86Cf596E3b124781E0bdbC47bb458bec62')
    expect(validatorList[2]).to.be.equal('0xf4BEF13F9f4f2B203FAF0C3cBbaAbe1afE056955')
  })
})
