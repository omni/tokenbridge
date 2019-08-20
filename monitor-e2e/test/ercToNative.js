const assert = require('assert')
const axios = require('axios')
const Web3 = require('web3')
const shell = require('shelljs')
const { ercToNativeBridge, user, homeRPC, foreignRPC  } = require('../../e2e-commons/constants.json')

const baseUrl = ercToNativeBridge.monitor
const HOME_BRIDGE_ADDRESS = ercToNativeBridge.home
const FOREIGN_BRIDGE_ADDRESS = ercToNativeBridge.foreign
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

describe('ERC TO NATIVE', () => {
  let data

  before(async () => {
    ;({ data } = await axios.get(`${baseUrl}`))
  })

  it('balance', () => assert(parseInt(data.foreign.erc20Balance, 10) >= 0))
  it('should contain totalSupply', () => assert(data.home.totalSupply === '0'))
})

describe.skip('ERC TO NATIVE with changing state of contracts', () => {
  let data

  before(async () => {
    ;({ data } = await axios.get(`${baseUrl}`))
  })

  it('should change balanceDiff', async () => {
    console.log(user.address, HOME_BRIDGE_ADDRESS)
    // send transaction to home chain
    const depositTx = await homeWeb3.eth.sendTransaction({
      from: user.address,
      to: HOME_BRIDGE_ADDRESS,
      gasPrice: '1',
      gas: '50000',
      value: '1000000000000000000'
    })

    // Send a trivial transaction to generate a new block since the watcher
    // is configured to wait 1 confirmation block
    // await generateNewBlock(homeWeb3, user.address)

    console.log('first should be zero...')
    // assert(data.balanceDiff === 0)

    checkAll()
    ;({ data } = await axios.get(`${baseUrl}`))

    console.log('should not be zero...')
    assert(data.balanceDiff !== 0)
  })
})
