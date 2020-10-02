import { action, observable } from 'mobx'
import { getBlockNumber, getBalance } from './utils/web3'
import { fromDecimals } from './utils/decimals'
import {
  BRIDGE_VALIDATORS_ABI,
  ERC677_BRIDGE_TOKEN_ABI,
  BLOCK_REWARD_ABI,
  BRIDGE_MODES,
  FEE_MANAGER_MODE,
  getUnit,
  decodeFeeManagerMode,
  getBridgeABIs,
  HOME_V1_ABI,
  ERC20_BYTES32_ABI,
  getDeployedAtBlock,
  isErcToErcMode,
  isMediatorMode,
  HOME_AMB_ABI,
  FOREIGN_AMB_ABI
} from '../../../commons'
import {
  getMaxPerTxLimit,
  getMinPerTxLimit,
  getCurrentLimit,
  getPastEvents,
  getMessage,
  getErc677TokenAddress,
  getSymbol,
  getDecimals,
  getTotalSupply,
  getBalanceOf,
  mintedTotallyByBridge,
  totalBurntCoins,
  getName,
  getFeeManager,
  getHomeFee,
  getForeignFee,
  getFeeManagerMode,
  ZERO_ADDRESS,
  getValidatorList,
  getBlockRewardContract,
  getValidatorContract,
  getRequiredSignatures,
  getValidatorCount,
  getFee,
  getRequiredBlockConfirmations,
  getBridgeContract,
  getBridgeInterfacesVersion,
  AMB_MULTIPLE_REQUESTS_PER_TX_VERSION
} from './utils/contract'
import { balanceLoaded, removePendingTransaction } from './utils/testUtils'
import sleep from './utils/sleep'
import BN from 'bignumber.js'
import { processLargeArrayAsync } from './utils/array'
import { getRewardableData } from './utils/rewardable'

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

class HomeStore {
  @observable
  state = null

  @observable
  loading = true

  @observable
  events = []

  @observable
  errors = []

  @observable
  balance = ''

  @observable
  filter = false

  @observable
  maxCurrentDeposit = ''

  @observable
  maxPerTx = ''

  @observable
  latestBlockNumber = 0

  @observable
  validators = []

  @observable
  validatorsCount = 0

  @observable
  homeBridgeValidators = ''

  @observable
  requiredSignatures = 0

  @observable
  dailyLimit = 0

  @observable
  totalSpentPerDay = 0

  @observable
  tokenAddress = ''

  @observable
  symbol = process.env.REACT_APP_UI_NATIVE_TOKEN_DISPLAY_NAME || 'NONAME'

  @observable
  tokenName = ''

  @observable
  userBalance = 0

  @observable
  statistics = {
    deposits: 0,
    depositsValue: BN(0),
    withdrawals: 0,
    withdrawalsValue: BN(0),
    totalBridged: BN(0),
    users: new Set(),
    finished: false
  }

  @observable
  feeEventsFinished = false

  @observable
  lastEventRelayedOnHome = 0

  @observable
  depositFeeCollected = {
    value: BN(0),
    type: '',
    shouldDisplay: false,
    finished: false,
    title: ''
  }

  @observable
  withdrawFeeCollected = {
    value: BN(0),
    type: '',
    shouldDisplay: false,
    finished: false,
    title: ''
  }

  @observable
  requiredBlockConfirmations = 8

  feeManager = {
    totalFeeDistributedFromSignatures: BN(0),
    totalFeeDistributedFromAffirmation: BN(0)
  }
  networkName = process.env.REACT_APP_UI_HOME_NETWORK_DISPLAY_NAME || 'Unknown'
  filteredBlockNumber = 0
  homeBridge = {}
  COMMON_HOME_BRIDGE_ADDRESS = process.env.REACT_APP_COMMON_HOME_BRIDGE_ADDRESS
  explorerTxTemplate = process.env.REACT_APP_UI_HOME_EXPLORER_TX_TEMPLATE || ''
  explorerAddressTemplate = process.env.REACT_APP_UI_HOME_EXPLORER_ADDRESS_TEMPLATE || ''
  tokenContract = {}
  tokenDecimals = 18
  blockRewardContract = {}
  ambBridgeContract = {}
  ambBridgeInterfaceVersion = {}

  constructor(rootStore) {
    this.homeWeb3 = rootStore.web3Store.homeWeb3
    this.web3Store = rootStore.web3Store
    this.alertStore = rootStore.alertStore
    this.rootStore = rootStore
    this.waitingForConfirmation = new Set()
    this.setHome()
  }

  async setHome() {
    if (!this.rootStore.bridgeModeInitialized) {
      setTimeout(() => this.setHome(), 200)
      return
    }
    const { HOME_ABI } = getBridgeABIs(this.rootStore.bridgeMode)
    this.homeBridge = new this.homeWeb3.eth.Contract(HOME_ABI, this.COMMON_HOME_BRIDGE_ADDRESS)
    if (isErcToErcMode(this.rootStore.bridgeMode)) {
      await this.getTokenInfo()
    } else if (this.rootStore.bridgeMode === BRIDGE_MODES.ERC_TO_NATIVE) {
      await this.getBlockRewardContract()
    }
    await this.getBlockNumber()
    this.getMinPerTxLimit()
    this.getMaxPerTxLimit()
    this.getEvents()
    this.getBalance()
    this.getCurrentLimit()
    this.getFee()
    this.getRequiredBlockConfirmations()
    this.getValidators()
    this.getStatistics()
    this.getFeeEvents()
    this.calculateCollectedFees()
    setInterval(() => {
      this.getEvents()
      this.getBalance()
      this.getBlockNumber()
      this.getCurrentLimit()
    }, 15000)
  }

  @action
  async getTokenInfo() {
    try {
      this.tokenAddress = await getErc677TokenAddress(this.homeBridge)
      this.tokenContract = new this.homeWeb3.eth.Contract(ERC677_BRIDGE_TOKEN_ABI, this.tokenAddress)
      const alternativeContract = new this.homeWeb3.eth.Contract(ERC20_BYTES32_ABI, this.tokenAddress)
      try {
        this.symbol = await getSymbol(this.tokenContract)
      } catch (e) {
        // eslint-disable-next-line no-control-regex
        this.symbol = this.homeWeb3.utils.hexToAscii(await getSymbol(alternativeContract)).replace(/\u0000*$/, '')
      }
      try {
        this.tokenName = await getName(this.tokenContract)
      } catch (e) {
        // eslint-disable-next-line no-control-regex
        this.tokenName = this.homeWeb3.utils.hexToAscii(await getName(alternativeContract)).replace(/\u0000*$/, '')
      }
      this.tokenDecimals = await getDecimals(this.tokenContract)
    } catch (e) {
      console.error(e)
    }
  }

  @action
  async getBlockNumber() {
    try {
      this.latestBlockNumber = await getBlockNumber(this.homeWeb3)
    } catch (e) {
      console.error(e)
    }
  }

  @action
  async getMaxPerTxLimit() {
    try {
      this.maxPerTx = await getMaxPerTxLimit(this.homeBridge, this.tokenDecimals)
    } catch (e) {
      console.error(e)
    }
  }

  @action
  async getMinPerTxLimit() {
    try {
      this.minPerTx = await getMinPerTxLimit(this.homeBridge, this.tokenDecimals)
    } catch (e) {
      console.error(e)
    }
  }

  @action
  async getBalance() {
    try {
      if (isErcToErcMode(this.rootStore.bridgeMode)) {
        this.balance = await getTotalSupply(this.tokenContract)
        this.web3Store.getWeb3Promise.then(async () => {
          this.userBalance = await getBalanceOf(this.tokenContract, this.web3Store.defaultAccount.address)
          balanceLoaded()
        })
      } else if (this.rootStore.bridgeMode === BRIDGE_MODES.ERC_TO_NATIVE) {
        const mintedCoins = await mintedTotallyByBridge(this.blockRewardContract, this.COMMON_HOME_BRIDGE_ADDRESS)
        const burntCoins = await totalBurntCoins(this.homeBridge)
        this.balance = fromDecimals(mintedCoins.minus(burntCoins).toString(10), this.tokenDecimals)
      } else {
        this.balance = await getBalance(this.homeWeb3, this.COMMON_HOME_BRIDGE_ADDRESS)
      }
    } catch (e) {
      console.error(e)
      this.errors.push(e)
    }
  }

  @action
  async getFee() {
    if (!isMediatorMode(this.rootStore.bridgeMode)) {
      const feeManager = await getFeeManager(this.homeBridge)
      if (feeManager !== ZERO_ADDRESS) {
        const feeManagerModeHash = await getFeeManagerMode(this.homeBridge)
        this.feeManager.feeManagerMode = decodeFeeManagerMode(feeManagerModeHash)

        if (this.feeManager.feeManagerMode === FEE_MANAGER_MODE.BOTH_DIRECTIONS) {
          this.feeManager.homeFee = await getHomeFee(this.homeBridge)
          this.feeManager.foreignFee = await getForeignFee(this.homeBridge)
        } else {
          this.feeManager.homeFee = new BN(0)
          this.feeManager.foreignFee = await getForeignFee(this.homeBridge)
        }
      } else {
        this.feeManager.feeManagerMode = FEE_MANAGER_MODE.UNDEFINED
        this.feeManager.homeFee = new BN(0)
        this.feeManager.foreignFee = new BN(0)
      }
    } else if (this.rootStore.bridgeMode === BRIDGE_MODES.STAKE_AMB_ERC_TO_ERC) {
      this.feeManager.feeManagerMode = FEE_MANAGER_MODE.ONE_DIRECTION_STAKE
      this.feeManager.homeFee = await getFee(this.homeBridge)
      this.feeManager.foreignFee = new BN(0)
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
        let events = await getPastEvents(this.homeBridge, fromBlock, toBlock).catch(e => {
          console.error("Couldn't get events", e)
          return []
        })

        let homeEvents = []
        await asyncForEach(events, async event => {
          if (event.event === 'SignedForUserRequest' || event.event === 'CollectedSignatures') {
            event.signedTxHash = await this.getSignedTx(event.returnValues.messageHash)
          }
          homeEvents.push(event)
        })

        if (!this.filter) {
          this.events = homeEvents
        }

        if (this.waitingForConfirmation.size) {
          const confirmationEvents = homeEvents.filter(
            event =>
              event.event === 'AffirmationCompleted' &&
              this.waitingForConfirmation.has(event.returnValues.transactionHash)
          )
          confirmationEvents.forEach(event => {
            this.alertStore.setLoadingStepIndex(3)
            const urlExplorer = this.getExplorerTxUrl(event.transactionHash)
            const unitReceived = getUnit(this.rootStore.bridgeMode).unitHome
            setTimeout(() => {
              this.alertStore.pushSuccess(
                `${unitReceived} received on ${this.networkName} on Tx
              <a href='${urlExplorer}' target='blank' style="overflow-wrap: break-word;word-wrap: break-word;">
              ${event.transactionHash}</a>`,
                this.alertStore.HOME_TRANSFER_SUCCESS
              )
            }, 2000)
            this.waitingForConfirmation.delete(event.returnValues.transactionHash)
          })

          if (confirmationEvents.length) {
            removePendingTransaction()
          }
        }

        return homeEvents
      } catch (e) {
        this.alertStore.pushError(
          `Cannot establish connection to Home Network.\n
                 Please make sure you have set it up in env variables`,
          this.alertStore.HOME_CONNECTION_ERROR
        )
      }
    } else {
      this.detectMediatorTransferFinished(fromBlock, toBlock)
    }
  }

  async getSignedTx(messageHash) {
    try {
      const message = await getMessage(this.homeBridge, messageHash)
      return '0x' + message.substring(106, 170)
    } catch (e) {
      console.error(e)
    }
  }

  getExplorerTxUrl(txHash) {
    return this.explorerTxTemplate.replace('%s', txHash)
  }

  getExplorerAddressUrl(address) {
    return this.explorerAddressTemplate.replace('%s', address)
  }

  @action
  async filterByTxHashInReturnValues(transactionHash) {
    const events = await this.getEvents(1, 'latest')
    this.events = events.filter(event => event.returnValues.transactionHash === transactionHash)
  }
  @action
  async filterByTxHash(transactionHash) {
    const events = await this.getEvents(1, 'latest')
    this.events = events.filter(event => event.transactionHash === transactionHash)
    if (this.events.length > 0 && this.events[0].returnValues && this.events[0].returnValues.transactionHash) {
      await this.rootStore.foreignStore.filterByTxHashInReturnValues(this.events[0].returnValues.transactionHash)
    }
  }

  @action
  setFilter(value) {
    this.filter = value
  }

  @action
  async setBlockFilter(blockNumber) {
    this.filteredBlockNumber = blockNumber
    this.events = await this.getEvents()
  }

  @action
  async getCurrentLimit() {
    try {
      const result = await getCurrentLimit(
        this.homeBridge,
        this.rootStore.foreignStore.foreignBridge,
        this.tokenDecimals
      )
      this.maxCurrentDeposit = result.maxCurrentDeposit
      this.dailyLimit = result.dailyLimit
      this.totalSpentPerDay = result.totalSpentPerDay
    } catch (e) {
      console.error(e)
    }
  }

  addWaitingForConfirmation(hash, txReceipt) {
    if (
      isMediatorMode(this.rootStore.bridgeMode) &&
      this.ambBridgeInterfaceVersion.major >= AMB_MULTIPLE_REQUESTS_PER_TX_VERSION.major
    ) {
      const userRequestForAffirmationAbi = FOREIGN_AMB_ABI.filter(
        e => e.type === 'event' && e.name === 'UserRequestForAffirmation'
      )[0]
      const userRequestForAffirmationHash = this.homeWeb3.eth.abi.encodeEventSignature(userRequestForAffirmationAbi)
      // Get event in amb bridge
      const ambRawEvent = txReceipt.logs.filter(
        e =>
          e.address === this.rootStore.foreignStore.ambBridgeContract.options.address &&
          e.topics[0] === userRequestForAffirmationHash
      )[0]

      const messageId = ambRawEvent.topics[1]
      this.waitingForConfirmation.add(messageId)
    } else {
      this.waitingForConfirmation.add(hash)
    }
    this.setBlockFilter(0)
    this.rootStore.foreignStore.setBlockFilter(0)
  }

  @action
  async getValidators() {
    if (!isMediatorMode(this.rootStore.bridgeMode)) {
      try {
        const homeValidatorsAddress = await getValidatorContract(this.homeBridge)
        this.homeBridgeValidators = new this.homeWeb3.eth.Contract(BRIDGE_VALIDATORS_ABI, homeValidatorsAddress)

        this.requiredSignatures = await getRequiredSignatures(this.homeBridgeValidators)
        this.validatorsCount = await getValidatorCount(this.homeBridgeValidators)

        this.validators = await getValidatorList(homeValidatorsAddress, this.homeWeb3.eth)
      } catch (e) {
        console.error(e)
      }
    }
  }

  async getStatistics() {
    try {
      if (!isMediatorMode(this.rootStore.bridgeMode)) {
        const deployedAtBlock = await getDeployedAtBlock(this.homeBridge)
        const { HOME_ABI } = getBridgeABIs(this.rootStore.bridgeMode)
        const abi = [...HOME_V1_ABI, ...HOME_ABI]
        const contract = new this.homeWeb3.eth.Contract(abi, this.COMMON_HOME_BRIDGE_ADDRESS)
        const events = await getPastEvents(contract, deployedAtBlock, 'latest')
        processLargeArrayAsync(events, this.processEvent, () => {
          this.statistics.finished = true
          this.statistics.totalBridged = this.statistics.totalBridged.plus(this.statistics.depositsValue)
        })
      } else {
        const events = await getPastEvents(this.homeBridge, 0, 'latest', 'TokensBridged')
        processLargeArrayAsync(events, this.processMediatorEvent, () => {
          this.statistics.finished = true
          this.statistics.totalBridged = this.statistics.depositsValue.plus(this.statistics.withdrawalsValue)
        })
        const lastEventRelayedOnHome = events.length ? events[events.length - 1] : null
        if (lastEventRelayedOnHome) {
          const blockNumber = lastEventRelayedOnHome.blockNumber
          const block = await this.homeWeb3.eth.getBlock(blockNumber)
          this.lastEventRelayedOnHome = block.timestamp
        }
      }
    } catch (e) {
      console.error(e)
      this.getStatistics()
    }
  }

  processEvent = event => {
    if (event.returnValues && event.returnValues.recipient) {
      this.statistics.users.add(event.returnValues.recipient)
    }
    if (event.event === 'UserRequestForSignature' || event.event === 'Deposit') {
      this.statistics.deposits++
      this.statistics.depositsValue = this.statistics.depositsValue.plus(
        BN(fromDecimals(event.returnValues.value, this.tokenDecimals))
      )
    } else if (event.event === 'AffirmationCompleted' || event.event === 'Withdraw') {
      this.statistics.withdrawals++
      this.statistics.withdrawalsValue = this.statistics.withdrawalsValue.plus(
        BN(fromDecimals(event.returnValues.value, this.tokenDecimals))
      )
    } else if (event.event === 'FeeDistributedFromSignatures') {
      this.feeManager.totalFeeDistributedFromSignatures = this.feeManager.totalFeeDistributedFromSignatures.plus(
        BN(fromDecimals(event.returnValues.feeAmount, this.tokenDecimals))
      )
    } else if (event.event === 'FeeDistributedFromAffirmation') {
      this.feeManager.totalFeeDistributedFromAffirmation = this.feeManager.totalFeeDistributedFromAffirmation.plus(
        BN(fromDecimals(event.returnValues.feeAmount, this.tokenDecimals))
      )
    }
  }

  processMediatorEvent = event => {
    if (event.returnValues && event.returnValues.recipient) {
      this.statistics.users.add(event.returnValues.recipient)
    }
    this.statistics.deposits++
    this.statistics.depositsValue = this.statistics.depositsValue.plus(
      BN(fromDecimals(event.returnValues.value, this.tokenDecimals))
    )
  }

  async getFeeEvents() {
    try {
      if (this.rootStore.bridgeMode === BRIDGE_MODES.STAKE_AMB_ERC_TO_ERC) {
        const blockRewardAddress = await getBlockRewardContract(this.homeBridge)
        const blockRewardContract = new this.homeWeb3.eth.Contract(BLOCK_REWARD_ABI, blockRewardAddress)
        const events = await getPastEvents(blockRewardContract, 0, 'latest', 'BridgeTokenRewardAdded', {
          filter: {
            bridge: this.COMMON_HOME_BRIDGE_ADDRESS
          }
        })

        processLargeArrayAsync(events, this.processFeeEvents, () => {
          this.feeEventsFinished = true
        })
      } else {
        this.feeEventsFinished = true
      }
    } catch (e) {
      console.error(e)
      this.getFeeEvents()
    }
  }

  processFeeEvents = event => {
    this.feeManager.totalFeeDistributedFromSignatures = this.feeManager.totalFeeDistributedFromSignatures.plus(
      BN(fromDecimals(event.returnValues.amount, this.tokenDecimals))
    )
  }

  calculateCollectedFees() {
    if (
      !this.statistics.finished ||
      !this.feeEventsFinished ||
      !this.rootStore.foreignStore.feeEventsFinished ||
      !this.feeManager.feeManagerMode ||
      !this.rootStore.foreignStore.feeManager.feeManagerMode
    ) {
      setTimeout(() => {
        this.calculateCollectedFees()
      }, 1000)
      return
    }

    const data = getRewardableData(this.feeManager, this.rootStore.foreignStore.feeManager)

    this.depositFeeCollected.type = data.depositSymbol === 'home' ? this.symbol : this.rootStore.foreignStore.symbol
    this.withdrawFeeCollected.type = data.withdrawSymbol === 'home' ? this.symbol : this.rootStore.foreignStore.symbol
    this.depositFeeCollected.shouldDisplay = data.displayDeposit
    this.withdrawFeeCollected.shouldDisplay = data.displayWithdraw

    this.depositFeeCollected.value =
      data.depositSymbol === 'home'
        ? this.feeManager.totalFeeDistributedFromSignatures
        : this.rootStore.foreignStore.feeManager.totalFeeDistributedFromSignatures

    this.withdrawFeeCollected.value =
      data.withdrawSymbol === 'home'
        ? this.feeManager.totalFeeDistributedFromAffirmation
        : this.rootStore.foreignStore.feeManager.totalFeeDistributedFromAffirmation

    if (this.rootStore.bridgeMode === BRIDGE_MODES.STAKE_AMB_ERC_TO_ERC) {
      this.depositFeeCollected.title = 'Withdrawal Fees'
    }

    this.depositFeeCollected.finished = true
    this.withdrawFeeCollected.finished = true
  }

  getDailyQuotaCompleted() {
    return this.dailyLimit ? (this.totalSpentPerDay / this.dailyLimit) * 100 : 0
  }

  getDisplayedBalance() {
    return isErcToErcMode(this.rootStore.bridgeMode) ? this.userBalance : this.web3Store.defaultAccount.homeBalance
  }

  async getBlockRewardContract() {
    const blockRewardAddress = await getBlockRewardContract(this.homeBridge)
    this.blockRewardContract = new this.homeWeb3.eth.Contract(BLOCK_REWARD_ABI, blockRewardAddress)
  }

  async waitUntilProcessed(txHash, value) {
    const web3 = this.rootStore.foreignStore.foreignWeb3
    const bridge = this.homeBridge

    const tx = await web3.eth.getTransaction(txHash)
    const messageHash = web3.utils.soliditySha3(tx.from, web3.utils.toBN(value).toString(), txHash)
    const numSigned = await bridge.methods.numAffirmationsSigned(messageHash).call()
    const processed = await bridge.methods.isAlreadyProcessed(numSigned).call()

    if (processed) {
      return Promise.resolve()
    } else {
      return sleep(5000).then(() => this.waitUntilProcessed(txHash, value))
    }
  }

  async detectMediatorTransferFinished(fromBlock, toBlock) {
    if (this.waitingForConfirmation.size > 0) {
      try {
        const events = await getPastEvents(this.homeBridge, fromBlock, toBlock, 'TokensBridged')
        const confirmationEvents = events.filter(event => this.waitingForConfirmation.has(event.returnValues.messageId))
        if (confirmationEvents.length > 0) {
          const event = events[0]
          this.alertStore.setLoadingStepIndex(3)
          const urlExplorer = this.getExplorerTxUrl(event.transactionHash)
          const unitReceived = getUnit(this.rootStore.bridgeMode).unitHome
          this.waitingForConfirmation.delete(event.returnValues.messageId)
          removePendingTransaction()
          setTimeout(() => {
            this.alertStore.pushSuccess(
              `${unitReceived} received on ${this.networkName} on Tx
            <a href='${urlExplorer}' target='blank' style="overflow-wrap: break-word;word-wrap: break-word;">
            ${event.transactionHash}</a>`,
              this.alertStore.HOME_TRANSFER_SUCCESS
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
      const homeAMBBridgeContract = await getBridgeContract(this.homeBridge)
      this.ambBridgeContract = new this.homeWeb3.eth.Contract(HOME_AMB_ABI, homeAMBBridgeContract)
      this.requiredBlockConfirmations = await getRequiredBlockConfirmations(this.ambBridgeContract)
      this.ambBridgeInterfaceVersion = await getBridgeInterfacesVersion(this.ambBridgeContract)
    } else {
      this.requiredBlockConfirmations = await getRequiredBlockConfirmations(this.homeBridge)
    }
  }
}

export default HomeStore
