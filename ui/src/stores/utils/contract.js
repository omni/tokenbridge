import BN from 'bignumber.js'
import { fromDecimals } from './decimals'
import { fromWei } from 'web3-utils'
import { getValidatorList as commonGetValidatorList, getPastEvents as commonGetPastEvents } from '../../../../commons'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const AMB_MULTIPLE_REQUESTS_PER_TX_VERSION = {
  major: 5,
  minor: 0,
  patch: 0
}

export const getMaxPerTxLimit = async (contract, decimals) => {
  const maxPerTx = await contract.methods.maxPerTx().call()
  return fromDecimals(maxPerTx, decimals)
}

export const getMinPerTxLimit = async (contract, decimals) => {
  const minPerTx = await contract.methods.minPerTx().call()
  return fromDecimals(minPerTx, decimals)
}

export const getDailyLimit = async (contract, decimals) => {
  const dailyLimit = await contract.methods.dailyLimit().call()
  return fromDecimals(dailyLimit, decimals)
}

export const getCurrentSpentAmount = async (contract, dailyLimit, decimals) => {
  const currentDay = await contract.methods.getCurrentDay().call()
  const totalSpentPerDay = fromDecimals(await contract.methods.totalSpentPerDay(currentDay).call(), decimals)
  const maxCurrentDeposit = new BN(dailyLimit).minus(new BN(totalSpentPerDay)).toString(10)
  return { maxCurrentDeposit, totalSpentPerDay }
}

export const getPastEvents = async function(contract, fromBlock, toBlock, event = 'allEvents', options = {}) {
  if (Array.isArray(event)) {
    const eventArrays = await Promise.all(
      event.map(
        event =>
          contract.events[event]
            ? commonGetPastEvents(contract, { fromBlock, toBlock, event, options })
            : Promise.resolve([])
      )
    )
    return Array.prototype.concat(...eventArrays)
  }
  return commonGetPastEvents(contract, { fromBlock, toBlock, event, options })
}

export const getErc677TokenAddress = contract => contract.methods.erc677token().call()

export const getErc20TokenAddress = contract => contract.methods.erc20token().call()

export const getSymbol = contract => contract.methods.symbol().call()

export const getDecimals = contract => contract.methods.decimals().call()

export const getMessage = (contract, messageHash) => contract.methods.message(messageHash).call()

export const getTotalSupply = async (contract, decimals) => {
  const totalSupply = await contract.methods.totalSupply().call()
  return fromDecimals(totalSupply, decimals)
}

export const getBalanceOf = async (contract, address, decimals) => {
  const balance = await contract.methods.balanceOf(address).call()
  return fromDecimals(balance, decimals)
}

export const mintedTotallyByBridge = async (contract, bridgeAddress) => {
  const mintedCoins = await contract.methods.mintedTotallyByBridge(bridgeAddress).call()
  return new BN(mintedCoins)
}

export const totalBurntCoins = async contract => {
  const burntCoins = await contract.methods.totalBurntCoins().call()
  return new BN(burntCoins)
}

export const getValidatorList = async (address, eth) => commonGetValidatorList(address, eth, { logger: console })

export const getName = contract => contract.methods.name().call()

export const getFeeManager = async contract => {
  try {
    return await contract.methods.feeManagerContract().call()
  } catch (e) {
    return ZERO_ADDRESS
  }
}

export const getFeeManagerMode = contract => contract.methods.getFeeManagerMode().call()

export const getHomeFee = async contract => {
  const feeInWei = await contract.methods.getHomeFee().call()
  return new BN(fromWei(feeInWei.toString()))
}

export const getForeignFee = async contract => {
  const feeInWei = await contract.methods.getForeignFee().call()
  return new BN(fromWei(feeInWei.toString()))
}

export const getFee = async contract => {
  try {
    const feeInWei = await contract.methods.getFee().call()
    return new BN(fromWei(feeInWei.toString()))
  } catch (e) {
    return new BN(0)
  }
}

export const getBlockRewardContract = contract => contract.methods.blockRewardContract().call()

export const getValidatorContract = contract => contract.methods.validatorContract().call()

export const getRequiredSignatures = contract => contract.methods.requiredSignatures().call()

export const getValidatorCount = contract => contract.methods.validatorCount().call()

export const getRequiredBlockConfirmations = async contract => {
  const blockConfirmations = await contract.methods.requiredBlockConfirmations().call()
  return parseInt(blockConfirmations)
}

export const getBridgeContract = contract => contract.methods.bridgeContract().call()

export const getBridgeInterfacesVersion = async contract => {
  const { major, minor, patch } = await contract.methods.getBridgeInterfacesVersion().call()
  return {
    major: parseInt(major),
    minor: parseInt(minor),
    patch: parseInt(patch)
  }
}
