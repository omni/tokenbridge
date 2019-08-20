const assert = require('assert')
const axios = require('axios')
const Web3 = require('web3')
const shell = require('shelljs')
const { nativeToErcBridge, user, homeRPC, foreignRPC } = require('../../e2e-commons/constants.json')

const baseUrl = nativeToErcBridge.monitor
const HOME_BRIDGE_ADDRESS = nativeToErcBridge.home
const homeWeb3 = new Web3(new Web3.providers.HttpProvider(homeRPC.URL))
const foreignWeb3 = new Web3(new Web3.providers.HttpProvider(foreignRPC.URL))
homeWeb3.eth.accounts.wallet.add(user.privateKey)
foreignWeb3.eth.accounts.wallet.add(user.privateKey)

const checkAll = () => {
  // the different container names comes from macOS/linux docker differences and/or different docker-compose versions
  ;['e2e-commons_monitor_1', 'e2e_commons_monitor_1', 'e2ecommons_monitor_1'].forEach(container =>
    shell.exec(`docker exec ${container} yarn check-all`)
  )
}

describe('NATIVE TO ERC', () => {
  let data

  before(async () => {
    ;({ data } = await axios.get(`${baseUrl}`))
  })

  it('balance', () => assert(parseInt(data.home.balance, 10) >= 0))
  it('should contain totalSupply', () => assert(data.foreign.totalSupply === '0'))
})

describe('NATIVE TO ERC with changing state of contracts', () => {
  let data

  before(async () => {
    ;({ data } = await axios.get(`${baseUrl}`))
  })

  it('should change balanceDiff', async () => {
    assert(data.balanceDiff === 0)
    await homeWeb3.eth.sendTransaction({
      from: user.address,
      to: HOME_BRIDGE_ADDRESS,
      gasPrice: '1',
      gas: '50000',
      value: '1000000000000000000'
    })

    checkAll()
    ;({ data } = await axios.get(`${baseUrl}`))
    assert(data.balanceDiff !== 0)
  })
})
