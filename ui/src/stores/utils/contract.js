import BN from 'bignumber.js'
import { fromDecimals } from './decimals'
import { fromWei } from 'web3-utils'
import { getValidatorListX } from '../../../../commons'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const getMaxPerTxLimit = async (contract, decimals) => {
  const maxPerTx = await contract.methods.maxPerTx().call()
  return fromDecimals(maxPerTx, decimals)
}

export const getMinPerTxLimit = async (contract, decimals) => {
  const minPerTx = await contract.methods.minPerTx().call()
  return fromDecimals(minPerTx, decimals)
}

export const getCurrentLimit = async (contract, decimals) => {
  const currentDay = await contract.methods.getCurrentDay().call()
  const dailyLimit = await contract.methods.dailyLimit().call()
  const totalSpentPerDay = await contract.methods.totalSpentPerDay(currentDay).call()
  const maxCurrentDeposit = new BN(dailyLimit).minus(new BN(totalSpentPerDay)).toString(10)
  return {
    maxCurrentDeposit: fromDecimals(maxCurrentDeposit, decimals),
    dailyLimit: fromDecimals(dailyLimit, decimals),
    totalSpentPerDay: fromDecimals(totalSpentPerDay, decimals)
  }
}

export const getErc677TokenAddress = contract => contract.methods.erc677token().call()

export const getErc20TokenAddress = contract => contract.methods.erc20token().call()

export const getSymbol = contract => contract.methods.symbol().call()

export const getDecimals = contract => contract.methods.decimals().call()

export const getMessage = (contract, messageHash) => contract.methods.message(messageHash).call()

export const getTotalSupply = async contract => {
  const totalSupply = await contract.methods.totalSupply().call()
  const decimals = await contract.methods.decimals().call()
  return fromDecimals(totalSupply, decimals)
}

export const getBalanceOf = async (contract, address) => {
  const balance = await contract.methods.balanceOf(address).call()
  const decimals = await contract.methods.decimals().call()
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

export const getValidatorList = async (address, eth) => {
  const options = {
    logger: console
  }

  return await getValidatorListX(address, eth, options)
}

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

export const getBlockRewardContract = contract => contract.methods.blockRewardContract().call()

export const getValidatorContract = contract => contract.methods.validatorContract().call()

export const getRequiredSignatures = contract => contract.methods.requiredSignatures().call()

export const getValidatorCount = contract => contract.methods.validatorCount().call()
