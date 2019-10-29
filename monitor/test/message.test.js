const { expect } = require('chai')
const { normalizeEventInformation, eventWithoutReference } = require('../utils/message')

describe('normalizeEventInformation', () => {
  it('should return normalized object for UserRequestForSignature event', () => {
    // Given
    const event = {
      address: '0x7301CFA0e1756B71869E93d4e4Dca5c7d0eb0AA6',
      blockNumber: 324231,
      transactionHash: '0x17be1e0745136b9e2857124542f8218812db8fe4458236d5ae045c1ceeb79978',
      returnValues: {
        recipient: '0xA84944735B66e957Fe385567dcc85975022Fe68A',
        value: '100000000000000000000'
      },
      event: 'UserRequestForSignature'
    }

    // When
    const result = normalizeEventInformation(event)

    // Then
    expect(result.transactionHash).to.equal(event.transactionHash)
    expect(result.blockNumber).to.equal(event.blockNumber)
    expect(result.referenceTx).to.equal(event.transactionHash)
    expect(result.recipient).to.equal(event.returnValues.recipient)
    expect(result.value).to.equal(event.returnValues.value)
  })
  it('should return normalized object for UserRequestForAffirmation event', () => {
    // Given
    const event = {
      address: '0x7301CFA0e1756B71869E93d4e4Dca5c7d0eb0AA6',
      blockNumber: 324231,
      transactionHash: '0x17be1e0745136b9e2857124542f8218812db8fe4458236d5ae045c1ceeb79978',
      returnValues: {
        recipient: '0xA84944735B66e957Fe385567dcc85975022Fe68A',
        value: '100000000000000000000'
      },
      event: 'UserRequestForAffirmation'
    }

    // When
    const result = normalizeEventInformation(event)

    // Then
    expect(result.transactionHash).to.equal(event.transactionHash)
    expect(result.blockNumber).to.equal(event.blockNumber)
    expect(result.referenceTx).to.equal(event.transactionHash)
    expect(result.recipient).to.equal(event.returnValues.recipient)
    expect(result.value).to.equal(event.returnValues.value)
  })
  it('should return normalized object for transfer event', () => {
    // Given
    const event = {
      address: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
      blockNumber: 6593953,
      transactionHash: '0x05afb402e27946d3600b100020dc23419ffd10cb61d3b241cee7b4a84909b48a',
      returnValues: {
        from: '0x13C0a8009A578837fB7A80Aa252F6A3ba4aD6B79',
        to: '0x4aa42145Aa6Ebf72e164C9bBC74fbD3788045016',
        value: '4000000000000000000'
      },
      event: 'Transfer'
    }

    // When
    const result = normalizeEventInformation(event)

    // Then
    expect(result.transactionHash).to.equal(event.transactionHash)
    expect(result.blockNumber).to.equal(event.blockNumber)
    expect(result.referenceTx).to.equal(event.transactionHash)
    expect(result.recipient).to.equal(event.returnValues.from)
    expect(result.value).to.equal(event.returnValues.value)
  })
  it('should return normalized object for RelayedMessage event', () => {
    // Given
    const event = {
      address: '0x4aa42145Aa6Ebf72e164C9bBC74fbD3788045016',
      blockNumber: 7025826,
      transactionHash: '0x6ee5969973da763d6d9f162d2dd1b1ec34c2dd977dc39e6b25030b4f04471567',
      returnValues: {
        recipient: '0x38BC00Ea43EbB5ef5150593A0BA6C381803717e2',
        value: '4900000000000000000',
        transactionHash: '0x5c5c2ab5e333bda4acd035a6a30ea29c7370351891d85373b2d06c7cc6cbb210'
      },
      event: 'RelayedMessage'
    }

    // When
    const result = normalizeEventInformation(event)

    // Then
    expect(result.transactionHash).to.equal(event.transactionHash)
    expect(result.blockNumber).to.equal(event.blockNumber)
    expect(result.referenceTx).to.equal(event.returnValues.transactionHash)
    expect(result.recipient).to.equal(event.returnValues.recipient)
    expect(result.value).to.equal(event.returnValues.value)
  })
  it('should return normalized object for AffirmationCompleted event', () => {
    // Given
    const event = {
      address: '0x7301CFA0e1756B71869E93d4e4Dca5c7d0eb0AA6',
      blockNumber: 474439,
      transactionHash: '0x654004b372ba32754cef34f403153bbdf43f0fbb3191d5e4683bba7f32e0dc4a',

      returnValues: {
        recipient: '0x9b7b2B4f7a391b6F14A81221AE0920A9735B67Fb',
        value: '5000000000000000000',
        transactionHash: '0xe96da94bbda2cfc865acd3f98040f5c79a627ee9de839d86885d34acd8ecd10d'
      },
      event: 'AffirmationCompleted'
    }

    // When
    const result = normalizeEventInformation(event)

    // Then
    expect(result.transactionHash).to.equal(event.transactionHash)
    expect(result.blockNumber).to.equal(event.blockNumber)
    expect(result.referenceTx).to.equal(event.returnValues.transactionHash)
    expect(result.recipient).to.equal(event.returnValues.recipient)
    expect(result.value).to.equal(event.returnValues.value)
  })
})
describe('eventWithoutReference', () => {
  it('should return false if event is present', () => {
    // Given
    const event = {
      txHash: '0x17be1e0745136b9e2857124542f8218812db8fe4458236d5ae045c1ceeb79978',
      blockNumber: 474439,
      referenceTx: '0x17be1e0745136b9e2857124542f8218812db8fe4458236d5ae045c1ceeb79978',
      recipient: '0x9b7b2B4f7a391b6F14A81221AE0920A9735B67Fb',
      value: '5000000000000000000'
    }

    const otherSideEvents = [
      {
        txHash: '0x17be1e0745136b9e2857124542f8218812db8fe4458236d5ae045c1ceeb79978',
        blockNumber: 474439,
        referenceTx: '0x17be1e0745136b9e2857124542f8218812db8fe4458236d5ae045c1ceeb79978',
        recipient: '0x9b7b2B4f7a391b6F14A81221AE0920A9735B67Fb',
        value: '5000000000000000000'
      },
      {
        txHash: '0x17be1e0745136b9e2857124542f8218812db8fe4458236d5ae045c1ceeb79978',
        blockNumber: 474439,
        referenceTx: '0x17be1e0745136b9e2857124542f8218812db8fe4458236d5ae045c1ceeb79978',
        recipient: '0x38BC00Ea43EbB5ef5150593A0BA6C381803717e2',
        value: '6000000000000000000'
      },
      {
        txHash: '0x17be1e0745136b9e2857124542f8218812db8fe4458236d5ae045c1ceeb79978',
        blockNumber: 474439,
        referenceTx: '0x17be1e0745136b9e2857124542f8218812db8fe4458236d5ae045c1ceeb79978',
        recipient: '0x38BC00Ea43EbB5ef5150593A0BA6C381803717e2',
        value: '8000000000000000000'
      }
    ]

    // When
    const result = eventWithoutReference(otherSideEvents)(event)

    // Then
    expect(result).to.equal(false)
  })
  it('should return true if event is not present', () => {
    // Given
    const event = {
      txHash: '0xe96da94bbda2cfc865acd3f98040f5c79a627ee9de839d86885d34acd8ecd10d',
      blockNumber: 474439,
      referenceTx: '0xe96da94bbda2cfc865acd3f98040f5c79a627ee9de839d86885d34acd8ecd10d',
      recipient: '0x9b7b2B4f7a391b6F14A81221AE0920A9735B67Fb',
      value: '2000000000000000000'
    }

    const otherSideEvents = [
      {
        txHash: '0x17be1e0745136b9e2857124542f8218812db8fe4458236d5ae045c1ceeb79978',
        blockNumber: 474439,
        referenceTx: '0x17be1e0745136b9e2857124542f8218812db8fe4458236d5ae045c1ceeb79978',
        recipient: '0x9b7b2B4f7a391b6F14A81221AE0920A9735B67Fb',
        value: '5000000000000000000'
      },
      {
        txHash: '0x05afb402e27946d3600b100020dc23419ffd10cb61d3b241cee7b4a84909b48a',
        blockNumber: 474439,
        referenceTx: '0x05afb402e27946d3600b100020dc23419ffd10cb61d3b241cee7b4a84909b48a',
        recipient: '0x38BC00Ea43EbB5ef5150593A0BA6C381803717e2',
        value: '6000000000000000000'
      },
      {
        txHash: '0x17be1e0745136b9e2857124542f8218812db8fe4458236d5ae045c1ceeb79978',
        blockNumber: 474439,
        referenceTx: '0x17be1e0745136b9e2857124542f8218812db8fe4458236d5ae045c1ceeb79978',
        recipient: '0x38BC00Ea43EbB5ef5150593A0BA6C381803717e2',
        value: '8000000000000000000'
      }
    ]

    // When
    const result = eventWithoutReference(otherSideEvents)(event)

    // Then
    expect(result).to.equal(true)
  })
})
