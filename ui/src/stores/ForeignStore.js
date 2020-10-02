import { action, observable } from 'mobx'
import { getBlockNumber } from './utils/web3'
import {
  BRIDGE_VALIDATORS_ABI,
  ERC677_BRIDGE_TOKEN_ABI,
  BRIDGE_MODES,
  FEE_MANAGER_MODE,
  getUnit,
  decodeFeeManagerMode,
  getBridgeABIs,
  getTokenType,
  ERC20_BYTES32_ABI,
  getDeployedAtBlock,
  isMediatorMode,
  FOREIGN_AMB_ABI,
  HOME_AMB_ABI
} from '../../../commons'
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
  getValidatorList,
  getValidatorContract,
  getRequiredSignatures,
  getValidatorCount,
  getRequiredBlockConfirmations,
  getBridgeContract,
  getBridgeInterfacesVersion,
  AMB_MULTIPLE_REQUESTS_PER_TX_VERSION
} from './utils/contract'
import { balanceLoaded, removePendingTransaction } from './utils/testUtils'
import sleep from './utils/sleep'
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

  @observable
  statistics = {
    finished: false
  }

  @observable
  lastEventRelayedOnForeign = 0

  @observable
  requiredBlockConfirmations = 8

  feeManager = {
    totalFeeDistributedFromSignatures: BN(0),
    totalFeeDistributedFromAffirmation: BN(0)
  }
  networkName = process.env.REACT_APP_UI_FOREIGN_NETWORK_DISPLAY_NAME || 'Unknown'
  filteredBlockNumber = 0
  foreignBridge = {}
  tokenContract = {}
  tokenDecimals = 18
  COMMON_FOREIGN_BRIDGE_ADDRESS = process.env.REACT_APP_COMMON_FOREIGN_BRIDGE_ADDRESS
  explorerTxTemplate = process.env.REACT_APP_UI_FOREIGN_EXPLORER_TX_TEMPLATE || ''
  explorerAddressTemplate = process.env.REACT_APP_UI_FOREIGN_EXPLORER_ADDRESS_TEMPLATE || ''
  ambBridgeContract = {}
  ambBridgeInterfaceVersion = {}

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
    this.foreignBridge = new this.foreignWeb3.eth.Contract(FOREIGN_ABI, this.COMMON_FOREIGN_BRIDGE_ADDRESS)
    await this.getBlockNumber()
    await this.getTokenInfo()
    this.getMinPerTxLimit()
    this.getMaxPerTxLimit()
    this.getEvents()
    this.getTokenBalance()
    this.getCurrentLimit()
    this.getFee()
    this.getRequiredBlockConfirmations()
    this.getValidators()
    this.getStatistics()
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
      this.tokenContract = new this.foreignWeb3.eth.Contract(ERC677_BRIDGE_TOKEN_ABI, this.tokenAddress)
      this.tokenType = await getTokenType(this.tokenContract, this.COMMON_FOREIGN_BRIDGE_ADDRESS)
      const alternativeContract = new this.foreignWeb3.eth.Contract(ERC20_BYTES32_ABI, this.tokenAddress)
      try {
        this.symbol = await getSymbol(this.tokenContract)
      } catch (e) {
        // eslint-disable-next-line no-control-regex
        this.symbol = this.foreignWeb3.utils.hexToAscii(await getSymbol(alternativeContract)).replace(/\u0000*$/, '')
      }
      try {
        this.tokenName = await getName(this.tokenContract)
      } catch (e) {
        // eslint-disable-next-line no-control-regex
        this.tokenName = this.foreignWeb3.utils.hexToAscii(await getName(alternativeContract)).replace(/\u0000*$/, '')
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
    fromBlock = fromBlock || this.filteredBlockNumber || this.latestBlockNumber - 50
    toBlock = toBlock || this.filteredBlockNumber || 'latest'

    if (fromBlock < 0) {
      fromBlock = 0
    }

    if (!isMediatorMode(this.rootStore.bridgeMode)) {
      try {
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
              event.event === 'RelayedMessage' && this.waitingForConfirmation.has(event.returnValues.transactionHash)
          )
          confirmationEvents.forEach(async event => {
            const TxReceipt = await this.getTxReceipt(event.transactionHash)
            if (TxReceipt && TxReceipt.logs && TxReceipt.logs.length > 1 && this.waitingForConfirmation.size) {
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
    } else {
      this.detectMediatorTransferFinished(fromBlock, toBlock)
    }
  }

  @action
  async getCurrentLimit() {
    try {
      const result = await getCurrentLimit(this.foreignBridge, this.homeStore.homeBridge, this.tokenDecimals)
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

  addWaitingForConfirmation(hash, txReceipt) {
    if (
      isMediatorMode(this.rootStore.bridgeMode) &&
      this.ambBridgeInterfaceVersion.major >= AMB_MULTIPLE_REQUESTS_PER_TX_VERSION.major
    ) {
      const UserRequestForSignatureAbi = HOME_AMB_ABI.filter(
        e => e.type === 'event' && e.name === 'UserRequestForSignature'
      )[0]
      const UserRequestForSignatureHash = this.foreignWeb3.eth.abi.encodeEventSignature(UserRequestForSignatureAbi)
      // Get event in amb bridge
      const ambRawEvent = txReceipt.logs.filter(
        e =>
          e.address === this.rootStore.homeStore.ambBridgeContract.options.address &&
          e.topics[0] === UserRequestForSignatureHash
      )[0]

      const messageId = ambRawEvent.topics[1]
      this.waitingForConfirmation.add(messageId)
    } else {
      this.waitingForConfirmation.add(hash)
    }
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
    if (!isMediatorMode(this.rootStore.bridgeMode)) {
      try {
        const foreignValidatorsAddress = await getValidatorContract(this.foreignBridge)
        this.foreignBridgeValidators = new this.foreignWeb3.eth.Contract(
          BRIDGE_VALIDATORS_ABI,
          foreignValidatorsAddress
        )

        this.requiredSignatures = await getRequiredSignatures(this.foreignBridgeValidators)
        this.validatorsCount = await getValidatorCount(this.foreignBridgeValidators)

        this.validators = await getValidatorList(foreignValidatorsAddress, this.foreignWeb3.eth)
      } catch (e) {
        console.error(e)
      }
    }
  }

  async getStatistics() {
    try {
      if (isMediatorMode(this.rootStore.bridgeMode)) {
        const events = await getPastEvents(this.foreignBridge, 0, 'latest', 'TokensBridged')
        processLargeArrayAsync(events, this.processMediatorEvent, () => {
          this.statistics.finished = true
          this.rootStore.homeStore.statistics.totalBridged = this.rootStore.homeStore.statistics.totalBridged.plus(
            this.rootStore.homeStore.statistics.withdrawalsValue
          )
        })
        const lastEventRelayedOnForeign = events.length ? events[events.length - 1] : null
        if (lastEventRelayedOnForeign) {
          const blockNumber = lastEventRelayedOnForeign.blockNumber
          const block = await this.foreignWeb3.eth.getBlock(blockNumber)
          this.lastEventRelayedOnForeign = block.timestamp
        }
      } else {
        this.statistics.finished = true
      }
    } catch (e) {
      console.error(e)
      this.getStatistics()
    }
  }

  processMediatorEvent = event => {
    if (event.returnValues && event.returnValues.recipient) {
      this.rootStore.homeStore.statistics.users.add(event.returnValues.recipient)
    }
    this.rootStore.homeStore.statistics.withdrawals++
    this.rootStore.homeStore.statistics.withdrawalsValue = this.rootStore.homeStore.statistics.withdrawalsValue.plus(
      BN(fromDecimals(event.returnValues.value, this.tokenDecimals))
    )
  }

  async getFeeEvents() {
    if (!isMediatorMode(this.rootStore.bridgeMode)) {
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
    } else {
      this.feeEventsFinished = true
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

  async detectMediatorTransferFinished(fromBlock, toBlock) {
    if (this.waitingForConfirmation.size > 0) {
      try {
        const events = await getPastEvents(this.foreignBridge, fromBlock, toBlock, 'TokensBridged')
        const confirmationEvents = events.filter(event => this.waitingForConfirmation.has(event.returnValues.messageId))
        if (confirmationEvents.length > 0) {
          const event = confirmationEvents[0]
          this.alertStore.setLoadingStepIndex(3)
          const urlExplorer = this.getExplorerTxUrl(event.transactionHash)
          const unitReceived = getUnit(this.rootStore.bridgeMode).unitForeign
          this.waitingForConfirmation.delete(event.returnValues.messageId)
          removePendingTransaction()
          setTimeout(() => {
            this.alertStore.pushSuccess(
              `${unitReceived} received on ${this.networkName} on Tx
            <a href='${urlExplorer}' target='blank' style="overflow-wrap: break-word;word-wrap: break-word;">
            ${event.transactionHash}</a>`,
              this.alertStore.FOREIGN_TRANSFER_SUCCESS
            )
          }, 2000)
        }
      } catch (e) {
        console.log(e)
      }
    }
  }

  async getRequiredBlockConfirmations() {
    if (isMediatorMode(this.rootStore.bridgeMode)) {
      const foreignAMBBridgeContract = await getBridgeContract(this.foreignBridge)
      this.ambBridgeContract = new this.foreignWeb3.eth.Contract(FOREIGN_AMB_ABI, foreignAMBBridgeContract)
      this.requiredBlockConfirmations = await getRequiredBlockConfirmations(this.ambBridgeContract)
      this.ambBridgeInterfaceVersion = await getBridgeInterfacesVersion(this.ambBridgeContract)
    } else {
      this.requiredBlockConfirmations = await getRequiredBlockConfirmations(this.foreignBridge)
    }
  }
}

export default ForeignStore
