import { action, observable } from 'mobx'
import { abi as ERC677_ABI } from '../../../contracts/build/contracts/ERC677BridgeToken.json'
import { getBlockNumber } from './utils/web3'
import {
  getMaxPerTxLimit,
  getMinPerTxLimit,
  getCurrentLimit,
  getPastEvents,
  getTotalSupply,
  getBalanceOf,
  getErc677TokenAddress,
  getSymbol,
  getDecimals,
  getErc20TokenAddress,
  getName,
  getFeeManager,
  getHomeFee,
  getFeeManagerMode,
  ZERO_ADDRESS,
  getDeployedAtBlock,
  getValidatorList,
  getTokenType
} from './utils/contract'
import { balanceLoaded, removePendingTransaction } from './utils/testUtils'
import sleep from './utils/sleep'
import {
  getBridgeABIs,
  getUnit,
  BRIDGE_MODES,
  decodeFeeManagerMode,
  FEE_MANAGER_MODE
} from './utils/bridgeMode'
import { abi as BRIDGE_VALIDATORS_ABI } from '../../../contracts/build/contracts/BridgeValidators'
import ERC20Bytes32Abi from './utils/ERC20Bytes32.abi'
import BN from 'bignumber.js'
import { processLargeArrayAsync } from './utils/array'
import { fromDecimals } from './utils/decimals'

class ForeignStore {
  @observable
  state = null

  @observable
  loading = true

  @observable
  events = []

  @observable
  totalSupply = ''

  @observable
  symbol = 'NOSYM'

  @observable
  tokenName = ''

  @observable
  balance = ''

  @observable
  filter = false

  @observable
  maxCurrentDeposit = ''

  @observable
  maxPerTx = ''

  @observable
  minPerTx = ''

  @observable
  latestBlockNumber = 0

  @observable
  validators = []

  @observable
  validatorsCount = 0

  @observable
  foreignBridgeValidators = ''

  @observable
  requiredSignatures = 0

  @observable
  dailyLimit = 0

  @observable
  totalSpentPerDay = 0

  @observable
  tokenAddress = ''

  @observable
  feeEventsFinished = false

  @observable
  tokenType = ''

  feeManager = {
    totalFeeDistributedFromSignatures: BN(0),
    totalFeeDistributedFromAffirmation: BN(0)
  }
  networkName = process.env.REACT_APP_FOREIGN_NETWORK_NAME || 'Unknown'
  filteredBlockNumber = 0
  foreignBridge = {}
  tokenContract = {}
  tokenDecimals = 18
  FOREIGN_BRIDGE_ADDRESS = process.env.REACT_APP_FOREIGN_BRIDGE_ADDRESS
  explorerTxTemplate = process.env.REACT_APP_FOREIGN_EXPLORER_TX_TEMPLATE || ''
  explorerAddressTemplate = process.env.REACT_APP_FOREIGN_EXPLORER_ADDRESS_TEMPLATE || ''

  constructor(rootStore) {
    this.web3Store = rootStore.web3Store
    this.foreignWeb3 = rootStore.web3Store.foreignWeb3
    this.alertStore = rootStore.alertStore
    this.homeStore = rootStore.homeStore
    this.rootStore = rootStore
    this.waitingForConfirmation = new Set()
    this.setForeign()
  }

  async setForeign() {
    if (!this.rootStore.bridgeModeInitialized) {
      setTimeout(() => this.setForeign(), 200)
      return
    }
    const { FOREIGN_ABI } = getBridgeABIs(this.rootStore.bridgeMode)
    this.foreignBridge = new this.foreignWeb3.eth.Contract(FOREIGN_ABI, this.FOREIGN_BRIDGE_ADDRESS)
    await this.getBlockNumber()
    await this.getTokenInfo()
    this.getMinPerTxLimit()
    this.getMaxPerTxLimit()
    this.getEvents()
    this.getTokenBalance()
    this.getCurrentLimit()
    this.getFee()
    this.getValidators()
    this.getFeeEvents()
    setInterval(() => {
      this.getBlockNumber()
      this.getEvents()
      this.getTokenBalance()
      this.getCurrentLimit()
    }, 15000)
  }

  @action
  async getBlockNumber() {
    try {
      this.latestBlockNumber = await getBlockNumber(this.foreignWeb3)
    } catch (e) {
      console.error(e)
    }
  }

  @action
  async getMaxPerTxLimit() {
    try {
      this.maxPerTx = await getMaxPerTxLimit(this.foreignBridge, this.tokenDecimals)
    } catch (e) {
      console.error(e)
    }
  }

  @action
  async getMinPerTxLimit() {
    try {
      this.minPerTx = await getMinPerTxLimit(this.foreignBridge, this.tokenDecimals)
    } catch (e) {
      console.error(e)
    }
  }

  @action
  async getTokenInfo() {
    try {
      this.tokenAddress =
        this.rootStore.bridgeMode === BRIDGE_MODES.ERC_TO_ERC ||
        this.rootStore.bridgeMode === BRIDGE_MODES.ERC_TO_NATIVE
          ? await getErc20TokenAddress(this.foreignBridge)
          : await getErc677TokenAddress(this.foreignBridge)
      this.tokenContract = new this.foreignWeb3.eth.Contract(ERC677_ABI, this.tokenAddress)
      this.tokenType = await getTokenType(this.tokenContract, this.FOREIGN_BRIDGE_ADDRESS)
      const alternativeContract = new this.foreignWeb3.eth.Contract(
        ERC20Bytes32Abi,
        this.tokenAddress
      )
      try {
        this.symbol = await getSymbol(this.tokenContract)
      } catch (e) {
        this.symbol = this.foreignWeb3.utils
          .hexToAscii(await getSymbol(alternativeContract))
          .replace(/\u0000*$/, '')
      }
      try {
        this.tokenName = await getName(this.tokenContract)
      } catch (e) {
        this.tokenName = this.foreignWeb3.utils
          .hexToAscii(await getName(alternativeContract))
          .replace(/\u0000*$/, '')
      }

      this.tokenDecimals = await getDecimals(this.tokenContract)
    } catch (e) {
      console.error(e)
    }
  }

  @action
  async getTokenBalance() {
    try {
      this.totalSupply = await getTotalSupply(this.tokenContract)
      this.web3Store.getWeb3Promise.then(async () => {
        this.balance = await getBalanceOf(this.tokenContract, this.web3Store.defaultAccount.address)
        balanceLoaded()
      })
    } catch (e) {
      console.error(e)
    }
  }

  @action
  async getFee() {
    const feeManager = await getFeeManager(this.foreignBridge)
    if (feeManager !== ZERO_ADDRESS) {
      const feeManagerModeHash = await getFeeManagerMode(this.foreignBridge)
      this.feeManager.feeManagerMode = decodeFeeManagerMode(feeManagerModeHash)

      if (this.feeManager.feeManagerMode === FEE_MANAGER_MODE.ONE_DIRECTION) {
        this.feeManager.foreignFee = new BN(0)
        this.feeManager.homeFee = await getHomeFee(this.foreignBridge)
      }
    } else {
      this.feeManager.feeManagerMode = FEE_MANAGER_MODE.UNDEFINED
      this.feeManager.homeFee = new BN(0)
      this.feeManager.foreignFee = new BN(0)
    }
  }

  @action
  async getEvents(fromBlock, toBlock) {
    try {
      fromBlock = fromBlock || this.filteredBlockNumber || this.latestBlockNumber - 50
      toBlock = toBlock || this.filteredBlockNumber || 'latest'

      if (fromBlock < 0) {
        fromBlock = 0
      }

      let foreignEvents = await getPastEvents(this.foreignBridge, fromBlock, toBlock).catch(e => {
        console.error("Couldn't get events", e)
        return []
      })

      if (!this.filter) {
        this.events = foreignEvents
      }

      if (this.waitingForConfirmation.size) {
        const confirmationEvents = foreignEvents.filter(
          event =>
            event.event === 'RelayedMessage' &&
            this.waitingForConfirmation.has(event.returnValues.transactionHash)
        )
        confirmationEvents.forEach(async event => {
          const TxReceipt = await this.getTxReceipt(event.transactionHash)
          if (
            TxReceipt &&
            TxReceipt.logs &&
            TxReceipt.logs.length > 1 &&
            this.waitingForConfirmation.size
          ) {
            this.alertStore.setLoadingStepIndex(3)
            const urlExplorer = this.getExplorerTxUrl(event.transactionHash)
            const unitReceived = getUnit(this.rootStore.bridgeMode).unitForeign
            setTimeout(() => {
              this.alertStore.pushSuccess(
                `${unitReceived} received on ${this.networkName} on Tx
            <a href='${urlExplorer}' target='blank' style="overflow-wrap: break-word;word-wrap: break-word;">
            ${event.transactionHash}</a>`,
                this.alertStore.FOREIGN_TRANSFER_SUCCESS
              )
            }, 2000)
            this.waitingForConfirmation.delete(event.returnValues.transactionHash)
          }
        })

        if (confirmationEvents.length) {
          removePendingTransaction()
        }
      }

      return foreignEvents
    } catch (e) {
      this.alertStore.pushError(
        `Cannot establish connection to Foreign Network.\n
                 Please make sure you have set it up in env variables`,
        this.alertStore.FOREIGN_CONNECTION_ERROR
      )
    }
  }

  @action
  async getCurrentLimit() {
    try {
      const result = await getCurrentLimit(this.foreignBridge, this.tokenDecimals)
      this.maxCurrentDeposit = result.maxCurrentDeposit
      this.dailyLimit = result.dailyLimit
      this.totalSpentPerDay = result.totalSpentPerDay
    } catch (e) {
      console.error(e)
    }
  }

  @action
  async filterByTxHashInReturnValues(transactionHash) {
    this.getTxAndRelatedEvents(transactionHash)
  }

  @action
  async filterByTxHash(transactionHash) {
    this.homeStore.filterByTxHashInReturnValues(transactionHash)
    await this.getTxAndRelatedEvents(transactionHash)
  }

  @action
  async getTxAndRelatedEvents(transactionHash) {
    try {
      const txReceipt = await this.getTxReceipt(transactionHash)
      const from = txReceipt.blockNumber - 20
      const to = txReceipt.blockNumber + 20
      const events = await this.getEvents(from, to)
      this.events = events.filter(
        event => event.transactionHash === transactionHash || event.signedTxHash === transactionHash
      )
    } catch (e) {
      this.events = []
    }
  }

  @action
  async setBlockFilter(blockNumber) {
    this.filteredBlockNumber = blockNumber
    this.events = await this.getEvents()
  }

  @action
  setFilter(value) {
    this.filter = value
  }

  addWaitingForConfirmation(hash) {
    this.waitingForConfirmation.add(hash)
    this.setBlockFilter(0)
    this.homeStore.setBlockFilter(0)
  }

  getTxReceipt(hash) {
    return this.foreignWeb3.eth.getTransactionReceipt(hash)
  }

  getDailyQuotaCompleted() {
    return this.dailyLimit ? (this.totalSpentPerDay / this.dailyLimit) * 100 : 0
  }

  async waitUntilProcessed(txHash) {
    const bridge = this.foreignBridge

    const processed = await bridge.methods.relayedMessages(txHash).call()

    if (processed) {
      return Promise.resolve()
    } else {
      return sleep(5000).then(() => this.waitUntilProcessed(txHash))
    }
  }

  getExplorerTxUrl(txHash) {
    return this.explorerTxTemplate.replace('%s', txHash)
  }

  getExplorerAddressUrl(address) {
    return this.explorerAddressTemplate.replace('%s', address)
  }

  @action
  async getValidators() {
    try {
      const foreignValidatorsAddress = await this.foreignBridge.methods.validatorContract().call()
      this.foreignBridgeValidators = new this.foreignWeb3.eth.Contract(
        BRIDGE_VALIDATORS_ABI,
        foreignValidatorsAddress
      )

      this.requiredSignatures = await this.foreignBridgeValidators.methods
        .requiredSignatures()
        .call()
      this.validatorsCount = await this.foreignBridgeValidators.methods.validatorCount().call()

      this.validators = await getValidatorList(foreignValidatorsAddress, this.foreignWeb3.eth)
    } catch (e) {
      console.error(e)
    }
  }

  async getFeeEvents() {
    try {
      const deployedAtBlock = await getDeployedAtBlock(this.foreignBridge)
      const events = await getPastEvents(this.foreignBridge, deployedAtBlock, 'latest')

      processLargeArrayAsync(events, this.processEvent, () => {
        this.feeEventsFinished = true
      })
    } catch (e) {
      console.error(e)
      this.getFeeEvents()
    }
  }

  processEvent = event => {
    if (event.event === 'FeeDistributedFromSignatures') {
      this.feeManager.totalFeeDistributedFromSignatures = this.feeManager.totalFeeDistributedFromSignatures.plus(
        BN(fromDecimals(event.returnValues.feeAmount, this.tokenDecimals))
      )
    } else if (event.event === 'FeeDistributedFromAffirmation') {
      this.feeManager.totalFeeDistributedFromAffirmation = this.feeManager.totalFeeDistributedFromAffirmation.plus(
        BN(fromDecimals(event.returnValues.feeAmount, this.tokenDecimals))
      )
    }
  }
}

export default ForeignStore
