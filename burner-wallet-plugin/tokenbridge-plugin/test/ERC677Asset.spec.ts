import { expect } from 'chai'
import 'mocha'
import ERC677Asset from '../src/burner-wallet/assets/ERC677Asset'

const ACCOUNT1 = '0x1010101010101010101010101010101010101010'
const ACCOUNT2 = '0x0000000000000000000000000000000000000001'
const TX_HASH = '0x376565f5614bd4483fd716c441aff43446b50f7772bef75496edef7faa070a85'
const ONE_ETH = '1000000000000000000'
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

describe('ERC677Asset', () => {
  it('should add an event when sent', done => {
    const asset = new ERC677Asset({
      id: 'test',
      name: 'Test',
      network: '5777',
      address: '0xcbfaa26289d24a6b4c5fe562bdd9a1b623260359'
    })

    const testConditions = event => {
      expect(event.asset).to.equal('test')
      expect(event.type).to.equal('send')
      expect(event.value).to.equal(ONE_ETH)
      expect(event.from).to.equal(ACCOUNT2)
      expect(event.to).to.equal(ACCOUNT1)
      expect(event.id).to.equal(`${TX_HASH}-0`)
      expect(event.tx).to.equal(TX_HASH)
      done()
    }

    const burnerCore = {
      addHistoryEvent: testConditions,
      getWeb3: () => ({
        eth: {
          methods: {},
          Contract: function Contract() {
            this.methods = {
              transferAndCall() {
                return {
                  send() {
                    return {
                      transactionHash: TX_HASH,
                      events: {
                        Transfer: {
                          logIndex: 0
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })
    }

    asset.setCore(burnerCore)
    asset.send({ to: ACCOUNT1, from: ACCOUNT2, value: ONE_ETH })
  })
  it('should watch an address and add events for new transactions', done => {
    const asset = new ERC677Asset({
      id: 'test',
      name: 'Test',
      network: '5777',
      address: '0xcbfaa26289d24a6b4c5fe562bdd9a1b623260359'
    })

    const testConditions = event => {
      expect(event.asset).to.equal('test')
      expect(event.type).to.equal('send')
      expect(event.value).to.equal(ONE_ETH)
      expect(event.from).to.equal(ACCOUNT2)
      expect(event.to).to.equal(ACCOUNT1)
      expect(event.tx).to.equal(TX_HASH)
      expect(event.timestamp).to.equal(1571234034)
      done()
    }

    const burnerCore = {
      addHistoryEvent: testConditions,
      getWeb3: () => ({
        eth: {
          getBlockNumber: () => 100,
          getBlock: () => ({ timestamp: 1571234034 }),
          Contract: function Contract() {
            // @ts-ignore
            this.getPastEvents = (eventName, { topics }) => {
              expect(eventName).to.equal('allEvents')
              expect(topics[0]).to.equal(TRANSFER_TOPIC)
              return [
                {
                  event: 'Transfer',
                  returnValues: {
                    to: ACCOUNT1,
                    from: ACCOUNT2,
                    value: ONE_ETH
                  },
                  transactionHash: TX_HASH
                }
              ]
            }
          }
        }
      })
    }

    asset.setCore(burnerCore)
    const unsubscribe = asset.startWatchingAddress(ACCOUNT1)
    unsubscribe()
  })
})
