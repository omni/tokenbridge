const Web3 = require('web3')
const assert = require('assert')
const promiseRetry = require('promise-retry')
const {
  user,
  secondUser,
  validator,
  ercToNativeBridge,
  homeRPC,
  foreignRPC
} = require('../../e2e-commons/constants.json')
const { ERC677_BRIDGE_TOKEN_ABI, FOREIGN_ERC_TO_NATIVE_ABI, SAI_TOP, HOME_ERC_TO_NATIVE_ABI } = require('../../commons')
const { uniformRetry, sleep } = require('../../e2e-commons/utils')
const { setRequiredSignatures } = require('./utils')

const homeWeb3 = new Web3(new Web3.providers.HttpProvider(homeRPC.URL))
const foreignWeb3 = new Web3(new Web3.providers.HttpProvider(foreignRPC.URL))

const COMMON_HOME_BRIDGE_ADDRESS = ercToNativeBridge.home
const COMMON_FOREIGN_BRIDGE_ADDRESS = ercToNativeBridge.foreign

const { toBN } = foreignWeb3.utils

homeWeb3.eth.accounts.wallet.add(user.privateKey)
homeWeb3.eth.accounts.wallet.add(validator.privateKey)
foreignWeb3.eth.accounts.wallet.add(user.privateKey)
foreignWeb3.eth.accounts.wallet.add(validator.privateKey)

const erc20Token = new foreignWeb3.eth.Contract(ERC677_BRIDGE_TOKEN_ABI, ercToNativeBridge.foreignToken)
const foreignBridge = new foreignWeb3.eth.Contract(FOREIGN_ERC_TO_NATIVE_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
const homeBridge = new homeWeb3.eth.Contract(HOME_ERC_TO_NATIVE_ABI, COMMON_HOME_BRIDGE_ADDRESS)

describe('erc to native', () => {
  let halfDuplexTokenAddress
  let halfDuplexToken
  before(async () => {
    halfDuplexTokenAddress = await foreignBridge.methods.halfDuplexErc20token().call()
    halfDuplexToken = new foreignWeb3.eth.Contract(ERC677_BRIDGE_TOKEN_ABI, halfDuplexTokenAddress)

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
  it('should continue working after migration', async () => {
    const originalBalanceOnHome = await homeWeb3.eth.getBalance(user.address)

    const transferValue = homeWeb3.utils.toWei('0.01')

    // erc20 token address and half duplex address are the same before migration
    const tokenAddress = await foreignBridge.methods.erc20token().call()

    const erc20AndhalfDuplexToken = new foreignWeb3.eth.Contract(ERC677_BRIDGE_TOKEN_ABI, tokenAddress)

    // send tokens to foreign bridge
    await erc20AndhalfDuplexToken.methods
      .transfer(COMMON_FOREIGN_BRIDGE_ADDRESS, transferValue)
      .send({
        from: user.address,
        gas: '1000000'
      })
      .catch(e => {
        console.error(e)
      })

    // check that balance increases
    await promiseRetry(async (retry, number) => {
      const balance = await homeWeb3.eth.getBalance(user.address)
      // retry at least 4 times to check transfer is not double processed by the two watchers
      if (toBN(balance).lte(toBN(originalBalanceOnHome)) || number < 4) {
        retry()
      } else {
        assert(
          toBN(balance).eq(toBN(originalBalanceOnHome).add(toBN(transferValue))),
          'User balance should be increased only by second transfer'
        )
      }
    })

    // call migration
    await foreignBridge.methods.migrateToMCD().send({
      from: validator.address,
      gas: '4000000'
    })

    // update min threshold for swap
    await foreignBridge.methods.setMinHDTokenBalance(foreignWeb3.utils.toWei('2', 'ether')).send({
      from: validator.address,
      gas: '1000000'
    })

    const AfterMigrateBalance = await homeWeb3.eth.getBalance(user.address)

    // send tokens to foreign bridge
    await erc20Token.methods
      .transfer(COMMON_FOREIGN_BRIDGE_ADDRESS, transferValue)
      .send({
        from: user.address,
        gas: '1000000'
      })
      .catch(e => {
        console.error(e)
      })

    // check that balance increases
    await promiseRetry(async (retry, number) => {
      const balance = await homeWeb3.eth.getBalance(user.address)
      // retry at least 4 times to check transfer is not double processed by the two watchers
      if (toBN(balance).lte(toBN(AfterMigrateBalance)) || number < 4) {
        retry()
      } else {
        assert(
          toBN(balance).eq(toBN(AfterMigrateBalance).add(toBN(transferValue))),
          'User balance should be increased only by second transfer'
        )
      }
    })

    const afterMigrateAndTransferBalance = await homeWeb3.eth.getBalance(user.address)

    // send tokens to foreign bridge
    await halfDuplexToken.methods
      .transfer(COMMON_FOREIGN_BRIDGE_ADDRESS, transferValue)
      .send({
        from: user.address,
        gas: '1000000'
      })
      .catch(e => {
        console.error(e)
      })

    // check that balance increases
    await promiseRetry(async (retry, number) => {
      const balance = await homeWeb3.eth.getBalance(user.address)
      // retry at least 4 times to check transfer is not double processed by the two watchers
      if (toBN(balance).lte(toBN(afterMigrateAndTransferBalance)) || number < 4) {
        retry()
      } else {
        assert(
          toBN(balance).eq(toBN(afterMigrateAndTransferBalance).add(toBN(transferValue))),
          'User balance should be increased only by second transfer'
        )
      }
    })
  })
  it('should convert tokens in foreign to coins in home', async () => {
    const balance = await erc20Token.methods.balanceOf(user.address).call()
    const originalBalanceOnHome = await homeWeb3.eth.getBalance(user.address)
    const initialBalanceSecondUser = await homeWeb3.eth.getBalance(secondUser.address)
    assert(!toBN(balance).isZero(), 'Account should have tokens')

    // approve tokens to foreign bridge
    await erc20Token.methods
      .approve(COMMON_FOREIGN_BRIDGE_ADDRESS, homeWeb3.utils.toWei('0.01'))
      .send({
        from: user.address,
        gas: '1000000'
      })
      .catch(e => {
        console.error(e)
      })

    // call bridge method to transfer tokens to a different recipient
    await foreignBridge.methods
      .relayTokens(secondUser.address, homeWeb3.utils.toWei('0.01'))
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
      const secondUserbalance = await homeWeb3.eth.getBalance(secondUser.address)
      assert(toBN(balance).lte(toBN(originalBalanceOnHome)), 'User balance should be the same')
      if (toBN(secondUserbalance).lte(toBN(initialBalanceSecondUser))) {
        retry()
      }
    })

    const transferValue = homeWeb3.utils.toWei('0.05')

    // send tokens to foreign bridge
    await erc20Token.methods
      .transfer(COMMON_FOREIGN_BRIDGE_ADDRESS, transferValue)
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
      if (toBN(balance).lte(toBN(originalBalanceOnHome))) {
        retry()
      } else {
        assert(
          toBN(balance).eq(toBN(originalBalanceOnHome).add(toBN(transferValue))),
          'User balance should be increased only by second transfer'
        )
      }
    })
  })
  it('should convert half duplex token in foreign to native token in home', async () => {
    const originalBalanceOnHome = await homeWeb3.eth.getBalance(user.address)
    const bridgeErc20TokenBalance = await erc20Token.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()
    const bridgeHalfDuplexBalance = await halfDuplexToken.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()

    const valueToTransfer = foreignWeb3.utils.toWei('1', 'ether')

    // this transfer won't trigger a call to swap tokens
    await halfDuplexToken.methods.transfer(COMMON_FOREIGN_BRIDGE_ADDRESS, valueToTransfer).send({
      from: user.address,
      gas: '1000000'
    })

    // check that balance increases
    await uniformRetry(async retry => {
      const balance = await homeWeb3.eth.getBalance(user.address)
      if (toBN(balance).lte(toBN(originalBalanceOnHome))) {
        retry()
      } else {
        assert(
          toBN(balance).eq(toBN(originalBalanceOnHome).add(toBN(valueToTransfer))),
          'User balance should be increased by the half duplex token transfer'
        )
      }
    })

    const updatedBalanceOnHome = await homeWeb3.eth.getBalance(user.address)
    const updatedBridgeHalfDuplexBalance = await halfDuplexToken.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()
    assert(
      toBN(updatedBridgeHalfDuplexBalance).eq(toBN(bridgeHalfDuplexBalance).add(toBN(valueToTransfer))),
      'Bridge balance should reflect the transfer value'
    )

    // this transfer will trigger call to swap tokens
    await halfDuplexToken.methods.transfer(COMMON_FOREIGN_BRIDGE_ADDRESS, valueToTransfer).send({
      from: user.address,
      gas: '1000000'
    })

    await sleep(2000)

    await uniformRetry(async retry => {
      const userBalance = await homeWeb3.eth.getBalance(user.address)
      const updatedBridgeErc20TokenBalance = await erc20Token.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()

      if (
        toBN(userBalance).lte(toBN(updatedBalanceOnHome)) ||
        toBN(updatedBridgeErc20TokenBalance).lte(toBN(bridgeErc20TokenBalance))
      ) {
        retry()
      } else {
        assert(
          toBN(userBalance).eq(toBN(updatedBalanceOnHome).add(toBN(valueToTransfer))),
          'User balance should be increased by the half duplex token transfer'
        )
        const updatedBalance = await halfDuplexToken.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()
        assert(toBN(updatedBalance).isZero(), 'Half duplex bridge balance should be zero')
        assert(
          toBN(updatedBridgeErc20TokenBalance).eq(
            toBN(bridgeErc20TokenBalance)
              .add(toBN(bridgeHalfDuplexBalance))
              .add(toBN(foreignWeb3.utils.toWei('2', 'ether')))
          ),
          'Erc20 token balance should be correctly increased by the token swap'
        )
      }
    })
  })
  it('should convert half duplex token in foreign to native token in home for alternative receiver ', async () => {
    const originalBalanceOnHome = await homeWeb3.eth.getBalance(user.address)
    const initialBalanceSecondUser = await homeWeb3.eth.getBalance(secondUser.address)
    const bridgeErc20TokenBalance = await erc20Token.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()

    const valueToTransfer = foreignWeb3.utils.toWei('1', 'ether')

    // approve tokens to foreign bridge
    await halfDuplexToken.methods
      .approve(COMMON_FOREIGN_BRIDGE_ADDRESS, valueToTransfer)
      .send({
        from: user.address,
        gas: '1000000'
      })
      .catch(e => {
        console.error(e)
      })

    // call bridge method to transfer tokens to a different recipient
    await foreignBridge.methods['relayTokens(address,uint256,address)'](
      secondUser.address,
      valueToTransfer,
      halfDuplexTokenAddress
    )
      .send({
        from: user.address,
        gas: '1000000'
      })
      .catch(e => {
        console.error(e)
      })

    // check that balance increases
    await uniformRetry(async retry => {
      const secondUserbalance = await homeWeb3.eth.getBalance(secondUser.address)
      const updatedBridgeErc20TokenBalance = await erc20Token.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()
      const userbalance = await homeWeb3.eth.getBalance(user.address)
      assert(toBN(userbalance).lte(toBN(originalBalanceOnHome)), 'User balance should be the same')
      if (
        toBN(secondUserbalance).lte(toBN(initialBalanceSecondUser)) ||
        toBN(updatedBridgeErc20TokenBalance).lte(toBN(bridgeErc20TokenBalance))
      ) {
        retry()
      } else {
        assert(
          toBN(secondUserbalance).eq(toBN(initialBalanceSecondUser).add(toBN(valueToTransfer))),
          'User balance should be increased by the half duplex token transfer'
        )
        const updatedHDBalance = await halfDuplexToken.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()
        assert(toBN(updatedHDBalance).isZero(), 'Half duplex bridge balance should be zero')
        assert(
          toBN(updatedBridgeErc20TokenBalance).eq(toBN(bridgeErc20TokenBalance).add(toBN(valueToTransfer))),
          'Erc20 token balance should be correctly increased by the token swap'
        )
      }
    })
  })
  it('should not relay half duplex token transfer after Emergency Shutdown', async () => {
    const originalBalanceOnHome = await homeWeb3.eth.getBalance(user.address)
    const bridgeErc20TokenBalance = await erc20Token.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()
    const bridgeHalfDuplexBalance = await halfDuplexToken.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()

    const block = await foreignWeb3.eth.getBlock('latest')
    const saiTop = new foreignWeb3.eth.Contract(SAI_TOP, ercToNativeBridge.saiTop)

    // Trigger Emergency Shutdown
    await saiTop.methods
      .setCaged(block.timestamp)
      .send({
        from: user.address,
        gas: '1000000'
      })
      .catch(e => {
        console.error(e)
      })

    const valueToTransfer = foreignWeb3.utils.toWei('1', 'ether')

    await sleep(2000)

    // this transfer won't trigger a call to swap tokens
    await halfDuplexToken.methods.transfer(COMMON_FOREIGN_BRIDGE_ADDRESS, valueToTransfer).send({
      from: user.address,
      gas: '1000000'
    })

    // check that transfer and swap are not processed in the next blocks.
    await promiseRetry(async (retry, number) => {
      const balanceOnHome = await homeWeb3.eth.getBalance(user.address)
      const currentBridgeErc20TokenBalance = await erc20Token.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()
      const currentBridgeHalfDuplexBalance = await halfDuplexToken.methods
        .balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS)
        .call()

      assert(toBN(balanceOnHome).eq(toBN(originalBalanceOnHome)), 'User balance should be the same')
      assert(
        toBN(currentBridgeHalfDuplexBalance).eq(toBN(bridgeHalfDuplexBalance).add(toBN(valueToTransfer))),
        'Half duplex balance should be the value of transfer'
      )
      assert(toBN(currentBridgeErc20TokenBalance).eq(toBN(bridgeErc20TokenBalance)), 'erc20 balance should not change')

      // after several retries, the state is corrects
      if (number < 4) {
        retry()
      }
    })

    // let's undo the Emergency Shutdown to check that the oracle is still working
    await saiTop.methods.setCaged('0').send({
      from: user.address,
      gas: '1000000'
    })

    const newValueToTransfer = foreignWeb3.utils.toWei('2', 'ether')

    await halfDuplexToken.methods.transfer(COMMON_FOREIGN_BRIDGE_ADDRESS, newValueToTransfer).send({
      from: user.address,
      gas: '1000000'
    })

    await sleep(2000)

    await uniformRetry(async retry => {
      const userBalance = await homeWeb3.eth.getBalance(user.address)
      const updatedBridgeErc20TokenBalance = await erc20Token.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()

      if (
        toBN(userBalance).lte(toBN(originalBalanceOnHome)) ||
        toBN(updatedBridgeErc20TokenBalance).lte(toBN(bridgeErc20TokenBalance))
      ) {
        retry()
      } else {
        assert(
          toBN(userBalance).eq(toBN(originalBalanceOnHome).add(toBN(newValueToTransfer))),
          'User balance should be increased by the half duplex token transfer'
        )
        const updatedHDBalance = await halfDuplexToken.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()
        assert(toBN(updatedHDBalance).isZero(), 'Half duplex bridge balance should be zero')
        assert(
          toBN(updatedBridgeErc20TokenBalance).eq(
            toBN(bridgeErc20TokenBalance)
              .add(toBN(valueToTransfer))
              .add(toBN(newValueToTransfer))
          ),
          'Erc20 token balance should be correctly increased by the token swap'
        )
      }
    })
  })
  it('should convert coins in home to tokens in foreign', async () => {
    const originalBalance = await erc20Token.methods.balanceOf(user.address).call()

    // check that account has tokens in home chain
    const balance = await homeWeb3.eth.getBalance(user.address)
    assert(!toBN(balance).isZero(), 'Account should have tokens')

    // send transaction to home bridge
    await homeWeb3.eth.sendTransaction({
      from: user.address,
      to: COMMON_HOME_BRIDGE_ADDRESS,
      gasPrice: '1',
      gas: '1000000',
      value: homeWeb3.utils.toWei('0.01')
    })

    // check that balance increases
    await uniformRetry(async retry => {
      const balance = await erc20Token.methods.balanceOf(user.address).call()
      if (toBN(balance).lte(toBN(originalBalance))) {
        retry()
      }
    })
  })
  it('should not invest dai when chai token is disabled', async () => {
    const bridgeDaiTokenBalance = await erc20Token.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()

    await foreignBridge.methods.setMinDaiTokenBalance(foreignWeb3.utils.toWei('2', 'ether')).send({
      from: validator.address,
      gas: '1000000'
    }) // set min limit for automatic investment to 2*2 dai

    const valueToTransfer = foreignWeb3.utils.toWei('5', 'ether')

    // this transfer won't trigger a call to convert to chai
    await erc20Token.methods.transfer(COMMON_FOREIGN_BRIDGE_ADDRESS, valueToTransfer).send({
      from: user.address,
      gas: '1000000'
    })

    await promiseRetry(async (retry, number) => {
      if (number < 4) {
        retry()
      } else {
        const updatedBridgeDaiTokenBalance = await erc20Token.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()
        assert(
          toBN(bridgeDaiTokenBalance)
            .add(toBN(valueToTransfer))
            .eq(toBN(updatedBridgeDaiTokenBalance)),
          'Dai tokens should not be when chai is disabled'
        )
      }
    })
  })
  it('should invest dai after enough tokens are collected on bridge account', async () => {
    await foreignBridge.methods.initializeChaiToken().send({
      from: validator.address,
      gas: '1000000'
    }) // initialize chai token
    await foreignBridge.methods.setMinDaiTokenBalance('0').send({
      from: validator.address,
      gas: '1000000'
    }) // set investing limit to 0
    await foreignBridge.methods.convertDaiToChai().send({
      from: validator.address,
      gas: '1000000'
    }) // convert all existing dai tokens on bridge account to chai, in order to start from zero balance
    await foreignBridge.methods.setMinDaiTokenBalance(foreignWeb3.utils.toWei('2', 'ether')).send({
      from: validator.address,
      gas: '1000000'
    }) // set investing limit to 2 dai, automatically invest should happen after 4 dai

    const valueToTransfer = foreignWeb3.utils.toWei('3', 'ether')

    // this transfer won't trigger a call to convert to chai
    await erc20Token.methods.transfer(COMMON_FOREIGN_BRIDGE_ADDRESS, valueToTransfer).send({
      from: user.address,
      gas: '1000000'
    })

    await promiseRetry(async (retry, number) => {
      if (number < 4) {
        retry()
      } else {
        const bridgeDaiTokenBalance = await erc20Token.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()
        assert(
          valueToTransfer === bridgeDaiTokenBalance,
          'Dai tokens should not be invested automatically before twice limit is reached'
        )
      }
    })

    // this transfer will trigger call to convert to chai
    await erc20Token.methods.transfer(COMMON_FOREIGN_BRIDGE_ADDRESS, valueToTransfer).send({
      from: user.address,
      gas: '1000000'
    })

    await promiseRetry(async retry => {
      const updatedBalance = await erc20Token.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()
      if (toBN(updatedBalance).gte(toBN(valueToTransfer).add(toBN(valueToTransfer)))) {
        retry()
      } else {
        const updatedBalance = await erc20Token.methods.balanceOf(COMMON_FOREIGN_BRIDGE_ADDRESS).call()
        assert(
          toBN(updatedBalance).eq(toBN(foreignWeb3.utils.toWei('2', 'ether'))),
          'Dai bridge balance should be equal to limit'
        )
      }
    })
  })

  describe('handling of chai swaps', async () => {
    before(async () => {
      // Next tests check validator nonces, this will force every validator to submit signature/affirmation
      // Set 3 required signatures for home bridge
      await setRequiredSignatures({
        bridgeContract: homeBridge,
        web3: homeWeb3,
        requiredSignatures: 3,
        options: {
          from: validator.address,
          gas: '4000000'
        }
      })

      // Set 3 required signatures for foreign bridge
      await setRequiredSignatures({
        bridgeContract: foreignBridge,
        web3: foreignWeb3,
        requiredSignatures: 3,
        options: {
          from: validator.address,
          gas: '4000000'
        }
      })
    })

    it('should not handle transfer event in paying interest', async () => {
      await foreignBridge.methods.setInterestReceiver(user.address).send({
        from: validator.address,
        gas: '1000000'
      })
      const initialNonce = await homeWeb3.eth.getTransactionCount(validator.address)
      await foreignBridge.methods.payInterest().send({
        from: user.address,
        gas: '1000000'
      })

      await promiseRetry(async (retry, number) => {
        if (number < 6) {
          retry()
        } else {
          const nonce = await homeWeb3.eth.getTransactionCount(validator.address)
          assert(
            nonce === initialNonce,
            'Validator should not process transfer event originated during converting Chai => Dai'
          )
        }
      })
    })

    it('should not handle chai withdrawal transfer event in executeSignatures as a regular transfer', async () => {
      await foreignBridge.methods.setMinDaiTokenBalance('0').send({
        from: validator.address,
        gas: '1000000'
      }) // set investing limit to 0
      await foreignBridge.methods.convertDaiToChai().send({
        from: validator.address,
        gas: '1000000'
      }) // convert all existing dai tokens on bridge account to chai, in order to start from zero balance

      const initialNonce = await homeWeb3.eth.getTransactionCount(validator.address)

      const originalBalance = await erc20Token.methods.balanceOf(user.address).call()
      // send transaction to home bridge
      await homeWeb3.eth.sendTransaction({
        from: user.address,
        to: COMMON_HOME_BRIDGE_ADDRESS,
        gasPrice: '1',
        gas: '1000000',
        value: homeWeb3.utils.toWei('0.01')
      })

      // check that balance increases
      await uniformRetry(async retry => {
        const balance = await erc20Token.methods.balanceOf(user.address).call()
        if (toBN(balance).lte(toBN(originalBalance))) {
          retry()
        }
      })

      await promiseRetry(async (retry, number) => {
        if (number < 6) {
          retry()
        } else {
          const nonce = await homeWeb3.eth.getTransactionCount(validator.address)
          assert(
            nonce === initialNonce + 1,
            'Validator should not process transfer event originated during converting Chai => Dai'
          )
        }
      })
    })

    after(async () => {
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
  })
})
