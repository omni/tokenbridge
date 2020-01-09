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
const {
  ERC677_BRIDGE_TOKEN_ABI,
  FOREIGN_ERC_TO_NATIVE_ABI,
  SAI_TOP,
  HOME_ERC_TO_NATIVE_ABI,
  BRIDGE_VALIDATORS_ABI
} = require('../../commons')
const { generateNewBlock } = require('../../e2e-commons/utils')

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

    const homeValidatorAddress = await homeBridge.methods.validatorContract().call()
    const foreignValidatorAddress = await foreignBridge.methods.validatorContract().call()

    const foreignValidator = new foreignWeb3.eth.Contract(BRIDGE_VALIDATORS_ABI, foreignValidatorAddress)
    const homeValidator = new homeWeb3.eth.Contract(BRIDGE_VALIDATORS_ABI, homeValidatorAddress)

    await homeValidator.methods.setRequiredSignatures(2).send({
      from: validator.address,
      gas: '4000000'
    })

    await foreignValidator.methods.setRequiredSignatures(2).send({
      from: validator.address,
      gas: '4000000'
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

    // Send a trivial transaction to generate a new block since the watcher
    // is configured to wait 1 confirmation block
    await generateNewBlock(foreignWeb3, user.address)

    // check that balance increases
    await promiseRetry(async (retry, number) => {
      const balance = await homeWeb3.eth.getBalance(user.address)
      await generateNewBlock(foreignWeb3, user.address)
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

    // Send a trivial transaction to generate a new block since the watcher
    // is configured to wait 1 confirmation block
    await generateNewBlock(foreignWeb3, user.address)

    // check that balance increases
    await promiseRetry(async (retry, number) => {
      const balance = await homeWeb3.eth.getBalance(user.address)
      await generateNewBlock(foreignWeb3, user.address)
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

    // Send a trivial transaction to generate a new block since the watcher
    // is configured to wait 1 confirmation block
    await generateNewBlock(foreignWeb3, user.address)

    // check that balance increases
    await promiseRetry(async (retry, number) => {
      const balance = await homeWeb3.eth.getBalance(user.address)
      await generateNewBlock(foreignWeb3, user.address)
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

    // Send a trivial transaction to generate a new block since the watcher
    // is configured to wait 1 confirmation block
    await generateNewBlock(foreignWeb3, user.address)

    // check that balance increases
    await promiseRetry(async retry => {
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

    // Send a trivial transaction to generate a new block since the watcher
    // is configured to wait 1 confirmation block
    await generateNewBlock(foreignWeb3, user.address)

    // check that balance increases
    await promiseRetry(async retry => {
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

    // Send a trivial transaction to generate a new block since the watcher
    // is configured to wait 1 confirmation block
    await generateNewBlock(foreignWeb3, user.address)

    // check that balance increases
    await promiseRetry(async retry => {
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

    await generateNewBlock(foreignWeb3, user.address)

    await promiseRetry(async retry => {
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

    // Send a trivial transaction to generate a new block since the watcher
    // is configured to wait 1 confirmation block
    await generateNewBlock(foreignWeb3, user.address)

    // check that balance increases
    await promiseRetry(async retry => {
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

    await generateNewBlock(foreignWeb3, user.address)

    // this transfer won't trigger a call to swap tokens
    await halfDuplexToken.methods.transfer(COMMON_FOREIGN_BRIDGE_ADDRESS, valueToTransfer).send({
      from: user.address,
      gas: '1000000'
    })

    // Send a trivial transaction to generate a new block since the watcher
    // is configured to wait 1 confirmation block
    await generateNewBlock(foreignWeb3, user.address)

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

      // generate new blocks
      await generateNewBlock(foreignWeb3, user.address)

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

    await generateNewBlock(foreignWeb3, user.address)

    await promiseRetry(async retry => {
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
    const depositTx = await homeWeb3.eth.sendTransaction({
      from: user.address,
      to: COMMON_HOME_BRIDGE_ADDRESS,
      gasPrice: '1',
      gas: '1000000',
      value: homeWeb3.utils.toWei('0.01')
    })

    // Send a trivial transaction to generate a new block since the watcher
    // is configured to wait 1 confirmation block
    await generateNewBlock(homeWeb3, user.address)

    // The bridge should create a new transaction with a CollectedSignatures
    // event so we generate another trivial transaction
    await promiseRetry(
      async retry => {
        const lastBlockNumber = await homeWeb3.eth.getBlockNumber()
        if (lastBlockNumber >= depositTx.blockNumber + 2) {
          await generateNewBlock(homeWeb3, user.address)
        } else {
          retry()
        }
      },
      {
        forever: true,
        factor: 1,
        minTimeout: 500
      }
    )

    // check that balance increases
    await promiseRetry(async retry => {
      const balance = await erc20Token.methods.balanceOf(user.address).call()
      if (toBN(balance).lte(toBN(originalBalance))) {
        retry()
      }
    })
  })
})
