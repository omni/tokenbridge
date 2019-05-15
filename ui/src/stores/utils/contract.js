import BN from 'bignumber.js'
import { fromDecimals } from './decimals'
import { fromWei } from 'web3-utils'
import { abi as rewardableValidatorsAbi } from '../../contracts/RewardableValidators'
import { ERC_TYPES } from "./bridgeMode"

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const getMaxPerTxLimit = async (contract,decimals) => {
  const maxPerTx = await contract.methods.maxPerTx().call()
  return fromDecimals(maxPerTx,decimals)
}

export const getMinPerTxLimit = async (contract,decimals) => {
  const minPerTx = await contract.methods.minPerTx().call()
  return fromDecimals(minPerTx,decimals)
}

export const getCurrentLimit = async (contract,decimals) => {
  const currentDay = await contract.methods.getCurrentDay().call()
  const dailyLimit = await contract.methods.dailyLimit().call()
  const totalSpentPerDay = await contract.methods.totalSpentPerDay(currentDay).call()
  const maxCurrentDeposit = new BN(dailyLimit).minus(new BN(totalSpentPerDay)).toString(10)
  return {
    maxCurrentDeposit: fromDecimals(maxCurrentDeposit,decimals),
    dailyLimit: fromDecimals(dailyLimit,decimals),
    totalSpentPerDay: fromDecimals(totalSpentPerDay,decimals)
  }
}

export const getPastEvents = (contract, fromBlock, toBlock, event = 'allEvents') => contract.getPastEvents(event, { fromBlock, toBlock })

export const getErc677TokenAddress = (contract) => contract.methods.erc677token().call()

export const getErc20TokenAddress = (contract) => contract.methods.erc20token().call()

export const getSymbol = (contract) => contract.methods.symbol().call()

export const getDecimals= (contract) => contract.methods.decimals().call()

export const getMessage = (contract, messageHash) => contract.methods.message(messageHash).call()

export const getTotalSupply = async (contract) => {
  const totalSupply = await contract.methods.totalSupply().call()
  const decimals = await contract.methods.decimals().call()
  return fromDecimals(totalSupply,decimals)
}

export const getBalanceOf = async (contract, address) => {
  const balance = await contract.methods.balanceOf(address).call()
  const decimals = await contract.methods.decimals().call()
  return fromDecimals(balance,decimals)
}

export const mintedTotally = async (contract) => {
  const mintedCoins = await contract.methods.mintedTotally().call()
  return new BN(mintedCoins)
}

export const totalBurntCoins = async (contract) => {
  const burntCoins = await contract.methods.totalBurntCoins().call()
  return new BN(burntCoins)
}

export const getValidatorList = async (address, eth) => {
  const validatorsContract = new eth.Contract(rewardableValidatorsAbi, address)
  const validators = await validatorList(validatorsContract)

  if(validators.length) {
    return validators
  }

  const deployedAtBlock = await getDeployedAtBlock(validatorsContract)
  const contract = new eth.Contract([], address)
  const validatorsEvents = await contract.getPastEvents('allEvents', { fromBlock: Number(deployedAtBlock) })

  return processValidatorsEvents(validatorsEvents)
}

export const validatorList = async (contract) => {
  try {
    return await contract.methods.validatorList().call()
  } catch (e) {
    return []
  }
}

export const processValidatorsEvents = (events) => {
  const validatorList = new Set()
  events.forEach(event => {
    parseValidatorEvent(event)

    if(event.event === 'ValidatorAdded') {
      validatorList.add(event.returnValues.validator)
    } else if(event.event === 'ValidatorRemoved') {
      validatorList.delete(event.returnValues.validator)
    }
    })

  return Array.from(validatorList)
}

export const parseValidatorEvent = (event) => {
  if (event.event === undefined
    && event.raw
    && event.raw.topics
    && (event.raw.topics[0] === '0xe366c1c0452ed8eec96861e9e54141ebff23c9ec89fe27b996b45f5ec3884987'
      || event.raw.topics[0] === '0x8064a302796c89446a96d63470b5b036212da26bd2debe5bec73e0170a9a5e83')) {
    const rawAddress = event.raw.topics.length > 1 ? event.raw.topics[1] : event.raw.data
    const address = '0x' + rawAddress.slice(26)
    event.event = 'ValidatorAdded'
    event.returnValues.validator = address
  } else if (event.event === undefined
    && event.raw
    && event.raw.topics
    && event.raw.topics[0] === "0xe1434e25d6611e0db941968fdc97811c982ac1602e951637d206f5fdda9dd8f1") {
    const rawAddress = event.raw.data === '0x' ? event.raw.topics[1] : event.raw.data
    const address = '0x' + rawAddress.slice(26)
    event.event = 'ValidatorRemoved'
    event.returnValues.validator = address
  }
}

export const getName = (contract) => contract.methods.name().call()

export const getFeeManager = async (contract) => {
 try {
   return await contract.methods.feeManagerContract().call()
 } catch (e) {
   return ZERO_ADDRESS
 }
}

export const getFeeManagerMode = (contract) => contract.methods.getFeeManagerMode().call()

export const getHomeFee = async (contract) => {
  const feeInWei = await contract.methods.getHomeFee().call()
  return new BN(fromWei(feeInWei.toString()))
}

export const getForeignFee = async (contract) => {
  const feeInWei = await contract.methods.getForeignFee().call()
  return new BN(fromWei(feeInWei.toString()))
}

export const getDeployedAtBlock = async (contract) => {
  try {
    return await contract.methods.deployedAtBlock().call()
  } catch (e) {
    return 0
  }
}

export const getTokenType = async (contract, bridgeAddress) => {
  try {
    const bridgeContract = await contract.methods.bridgeContract().call()
    if (bridgeContract === bridgeAddress) {
      return ERC_TYPES.ERC677
    } else {
      return ERC_TYPES.ERC20
    }
  } catch (e) {
    return ERC_TYPES.ERC20
  }
}
