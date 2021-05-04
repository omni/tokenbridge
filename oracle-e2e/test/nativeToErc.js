const Web3 = require('web3')
const assert = require('assert')
const {
  user,
  validator,
  secondValidator,
  thirdValidator,
  nativeToErcBridge,
  secondUser,
  thirdUser,
  fourthUser,
  homeRPC,
  foreignRPC
} = require('../../e2e-commons/constants.json')
const { ERC677_BRIDGE_TOKEN_ABI, HOME_NATIVE_TO_ERC_ABI, FOREIGN_NATIVE_TO_ERC_ABI } = require('../../commons')
const { uniformRetry, sleep } = require('../../e2e-commons/utils')
const { setRequiredSignatures } = require('./utils')

const homeWeb3 = new Web3(new Web3.providers.HttpProvider(homeRPC.URL))
const foreignWeb3 = new Web3(new Web3.providers.HttpProvider(foreignRPC.URL))
const { toBN } = foreignWeb3.utils

const COMMON_HOME_BRIDGE_ADDRESS = nativeToErcBridge.home
const COMMON_FOREIGN_BRIDGE_ADDRESS = nativeToErcBridge.foreign

const validatorAddresses = [validator.address, secondValidator.address, thirdValidator.address]

homeWeb3.eth.accounts.wallet.add(user.privateKey)
homeWeb3.eth.accounts.wallet.add(validator.privateKey)
homeWeb3.eth.accounts.wallet.add(secondUser.privateKey)
homeWeb3.eth.accounts.wallet.add(secondValidator.privateKey)
homeWeb3.eth.accounts.wallet.add(thirdValidator.privateKey)
homeWeb3.eth.accounts.wallet.add(thirdUser.privateKey)
homeWeb3.eth.accounts.wallet.add(fourthUser.privateKey)
foreignWeb3.eth.accounts.wallet.add(user.privateKey)
foreignWeb3.eth.accounts.wallet.add(validator.privateKey)
foreignWeb3.eth.accounts.wallet.add(secondUser.privateKey)
foreignWeb3.eth.accounts.wallet.add(secondValidator.privateKey)
foreignWeb3.eth.accounts.wallet.add(thirdValidator.privateKey)
foreignWeb3.eth.accounts.wallet.add(thirdUser.privateKey)
foreignWeb3.eth.accounts.wallet.add(fourthUser.privateKey)

const token = new foreignWeb3.eth.Contract(ERC677_BRIDGE_TOKEN_ABI, nativeToErcBridge.foreignToken)
const homeBridge = new homeWeb3.eth.Contract(HOME_NATIVE_TO_ERC_ABI, COMMON_HOME_BRIDGE_ADDRESS)
const foreignBridge = new foreignWeb3.eth.Contract(FOREIGN_NATIVE_TO_ERC_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)

describe('native to erc', () => {
  before(async () => {
    if (process.env.ULTIMATE === 'true') {
      return
    }
    console.log('Calling setRequiredSignatures(2)')

    // Set 2 required signatures for home bridge
    await setRequiredSignatures({
      bridgeContract: homeBridge,
      web3: homeWeb3,
      requiredSignatures: 2,
      options: {
        from: validator.address,
        gas: '4000000'
      }
    })

    // Set 2 required signatures for foreign bridge
    await setRequiredSignatures({
      bridgeContract: foreignBridge,
      web3: foreignWeb3,
      requiredSignatures: 2,
      options: {
        from: validator.address,
        gas: '4000000'
      }
    })
  })
  it('should convert eth in home to tokens in foreign', async () => {
    // check that account has zero tokens in the foreign chain
    const balance = await token.methods.balanceOf(user.address).call()
    assert(toBN(balance).isZero(), 'Account should not have tokens yet')

    // send transaction to home chain
    await homeWeb3.eth.sendTransaction({
      from: user.address,
      to: COMMON_HOME_BRIDGE_ADDRESS,
      gasPrice: '1',
      gas: '50000',
      value: '1000000000000000000'
    })

    // check that account has tokens in the foreign chain
    await uniformRetry(async retry => {
      const balance = await token.methods.balanceOf(user.address).call()
      if (toBN(balance).isZero()) {
        retry()
      }
    })
  })

  it('should convert tokens in foreign to eth in home', async () => {
    const originalBalance = await homeWeb3.eth.getBalance(user.address)

    // send tokens to foreign bridge
    await token.methods
      .transferAndCall(COMMON_FOREIGN_BRIDGE_ADDRESS, homeWeb3.utils.toWei('0.01'), '0x')
      .send({
        from: user.address,
        gas: '1000000'
      })
      .catch(e => {
        console.error(e)
      })

    // check that balance increases
    await uniformRetry(async retry => {
      const balance = await homeWeb3.eth.getBalance(user.address)
      if (toBN(balance).lte(toBN(originalBalance))) {
        retry()
      }
    })
  })

  it('should wait for funds if these are insufficient (Home)', async () => {
    // check that account has zero tokens in the foreign chain
    const originalBalance = toBN(await token.methods.balanceOf(user.address).call())

    // empty validator funds
    await sendAllBalance(homeWeb3, validator.address, secondUser.address)
    await sendAllBalance(homeWeb3, secondValidator.address, thirdUser.address)
    await sendAllBalance(homeWeb3, thirdValidator.address, fourthUser.address)

    const nonces = await Promise.all(validatorAddresses.map(homeWeb3.eth.getTransactionCount))
    // send transaction to home chain
    await homeWeb3.eth.sendTransaction({
      from: user.address,
      to: COMMON_HOME_BRIDGE_ADDRESS,
      gasPrice: '1',
      gas: '50000',
      value: '1000000000000000000'
    })

    // wait two seconds, no new blocks should have been generated
    await sleep(2000)
    const newNonces = await Promise.all(validatorAddresses.map(homeWeb3.eth.getTransactionCount))
    const balance = toBN(await token.methods.balanceOf(user.address).call())
    assert.deepStrictEqual(nonces, newNonces, "Shouldn't sent new tx")
    assert(originalBalance.eq(balance), "Token balance shouldn't have changed")

    // send funds back to validator
    await sendAllBalance(homeWeb3, secondUser.address, validator.address)
    await sendAllBalance(homeWeb3, thirdUser.address, secondValidator.address)
    await sendAllBalance(homeWeb3, fourthUser.address, thirdValidator.address)

    // check that token balance was incremented in foreign chain
    await uniformRetry(async retry => {
      const balance = toBN(await token.methods.balanceOf(user.address).call())
      if (!balance.gt(originalBalance)) {
        retry()
      }
    })
  })

  it('should wait for funds if these are insufficient (Foreign)', async () => {
    // get original tokens balance
    const originalBalance = toBN(await token.methods.balanceOf(user.address).call())

    // empty foreign validator funds
    await sendAllBalance(foreignWeb3, validator.address, secondUser.address)
    await sendAllBalance(foreignWeb3, secondValidator.address, thirdUser.address)
    await sendAllBalance(foreignWeb3, thirdValidator.address, fourthUser.address)
    const nonces = await Promise.all(validatorAddresses.map(foreignWeb3.eth.getTransactionCount))

    // send transaction to home chain
    await homeWeb3.eth.sendTransaction({
      from: user.address,
      to: COMMON_HOME_BRIDGE_ADDRESS,
      gasPrice: '1',
      gas: '50000',
      value: '1000000000000000000'
    })

    // tokens shouldn't be generated in the foreign chain because the validator doesn't have funds
    await sleep(2000)
    const newNonces = await Promise.all(validatorAddresses.map(foreignWeb3.eth.getTransactionCount))
    assert.deepStrictEqual(nonces, newNonces, "Shouldn't sent new tx")

    // send funds back to validator
    await sendAllBalance(foreignWeb3, secondUser.address, validator.address)
    await sendAllBalance(foreignWeb3, thirdUser.address, secondValidator.address)
    await sendAllBalance(foreignWeb3, fourthUser.address, thirdValidator.address)

    // check that account has tokens in the foreign chain
    await uniformRetry(async retry => {
      const balance = toBN(await token.methods.balanceOf(user.address).call())
      if (balance.eq(originalBalance)) {
        retry()
      }
    })
  })
})

async function sendAllBalance(web3, from, to) {
  const balance = await web3.eth.getBalance(from)
  const value = toBN(balance).sub(toBN('21000'))

  return web3.eth.sendTransaction({
    from,
    to,
    value,
    gas: '21000',
    gasPrice: '1'
  })
}
