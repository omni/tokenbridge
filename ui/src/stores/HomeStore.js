import { action, observable } from 'mobx';
import { abi as BRIDGE_VALIDATORS_ABI } from '../contracts/BridgeValidators.json'
import { abi as ERC677_ABI } from '../contracts/ERC677BridgeToken.json'
import { abi as BLOCK_REWARD_ABI } from '../contracts/IBlockReward'
import { getBlockNumber, getBalance } from './utils/web3'
import { fromDecimals } from './utils/decimals'
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
  mintedTotally,
  totalBurntCoins,
  getName,
  getFeeManager,
  getHomeFee,
  getForeignFee,
  getFeeManagerMode,
  ZERO_ADDRESS,
  getValidatorList,
  getDeployedAtBlock
} from './utils/contract'
import { balanceLoaded, removePendingTransaction } from './utils/testUtils'
import sleep from './utils/sleep'
import BN from 'bignumber.js'
import { getBridgeABIs, getUnit, BRIDGE_MODES, decodeFeeManagerMode, FEE_MANAGER_MODE } from './utils/bridgeMode'
import ERC20Bytes32Abi from './utils/ERC20Bytes32.abi'
import { processLargeArrayAsync } from './utils/array'
import { getRewardableData } from "./utils/rewardable"
import HomeBridgeV1Abi from './utils/HomeBridgeV1.abi'

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

class HomeStore {
  @observable state = null;
  @observable loading = true;
  @observable events = [];
  @observable errors = [];
  @observable balance = "";
  @observable filter = false;
  @observable maxCurrentDeposit = "";
  @observable maxPerTx = "";
  @observable latestBlockNumber = 0;
  @observable validators = []
  @observable validatorsCount = 0
  @observable homeBridgeValidators = ''
  @observable requiredSignatures = 0
  @observable dailyLimit = 0
  @observable totalSpentPerDay = 0
  @observable tokenAddress = '';
  @observable symbol = process.env.REACT_APP_HOME_NATIVE_NAME || 'NONAME';
  @observable tokenName = '';
  @observable userBalance = 0
  @observable statistics = {
    deposits: 0,
    depositsValue: BN(0),
    withdraws: 0,
    withdrawsValue: BN(0),
    totalBridged: BN(0),
    users: new Set(),
    finished: false
  }
  @observable depositFeeCollected = {
    value: BN(0),
    type: '',
    shouldDisplay: false,
    finished: false
  }
  @observable withdrawFeeCollected = {
    value: BN(0),
    type: '',
    shouldDisplay: false,
    finished: false
  }
  feeManager = {
    totalFeeDistributedFromSignatures: BN(0),
    totalFeeDistributedFromAffirmation: BN(0)
  };
  networkName = process.env.REACT_APP_HOME_NETWORK_NAME || 'Unknown'
  filteredBlockNumber = 0
  homeBridge = {};
  HOME_BRIDGE_ADDRESS = process.env.REACT_APP_HOME_BRIDGE_ADDRESS;
  explorerTxTemplate = process.env.REACT_APP_HOME_EXPLORER_TX_TEMPLATE || ''
  explorerAddressTemplate = process.env.REACT_APP_HOME_EXPLORER_ADDRESS_TEMPLATE || ''
  tokenContract = {}
  tokenDecimals = 18;
  blockRewardContract = {}

  constructor (rootStore) {
    this.homeWeb3 = rootStore.web3Store.homeWeb3
    this.web3Store = rootStore.web3Store
    this.alertStore = rootStore.alertStore
    this.rootStore = rootStore
    this.waitingForConfirmation = new Set()
    this.setHome()
  }

  async setHome(){
    if (!this.rootStore.bridgeModeInitialized) {
      setTimeout(() => this.setHome(), 200)
      return
    }
    const { HOME_ABI } = getBridgeABIs(this.rootStore.bridgeMode)
    this.homeBridge = new this.homeWeb3.eth.Contract(HOME_ABI, this.HOME_BRIDGE_ADDRESS);
    if (this.rootStore.bridgeMode === BRIDGE_MODES.ERC_TO_ERC) {
      await this.getTokenInfo()
    } else if(this.rootStore.bridgeMode === BRIDGE_MODES.ERC_TO_NATIVE) {
      await this.getBlockRewardContract()
    }
    await this.getBlockNumber()
    this.getMinPerTxLimit()
    this.getMaxPerTxLimit()
    this.getEvents()
    this.getBalance()
    this.getCurrentLimit()
    this.getFee()
    this.getValidators()
    this.getStatistics()
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
      this.tokenContract = new this.homeWeb3.eth.Contract(ERC677_ABI, this.tokenAddress);
      this.symbol = await getSymbol(this.tokenContract)
      this.tokenName = await getName(this.tokenContract)
      const alternativeContract = new this.homeWeb3.eth.Contract(ERC20Bytes32Abi, this.tokenAddress);
      try {
        this.symbol =await getSymbol(this.tokenContract)
      } catch(e) {
        this.symbol = this.homeWeb3.utils.hexToAscii(await getSymbol(alternativeContract)).replace(/\u0000*$/, '')
      }
      try {
        this.tokenName = await getName(this.tokenContract)
      } catch(e) {
        this.tokenName = this.homeWeb3.utils.hexToAscii(await getName(alternativeContract)).replace(/\u0000*$/, '')
      }
      this.tokenDecimals = await getDecimals(this.tokenContract)
    } catch(e) {
      console.error(e)
    }
  }

  @action
  async getBlockNumber() {
    try {
      this.latestBlockNumber = await getBlockNumber(this.homeWeb3)
    } catch(e){
      console.error(e)
    }
  }

  @action
  async getMaxPerTxLimit(){
    try {
      this.maxPerTx = await getMaxPerTxLimit(this.homeBridge,this.tokenDecimals)
    } catch(e){
      console.error(e)
    }
  }

  @action
  async getMinPerTxLimit(){
    try {
      this.minPerTx = await getMinPerTxLimit(this.homeBridge,this.tokenDecimals)
    } catch(e){
      console.error(e)
    }
  }

  @action
  async getBalance() {
    try {
      if (this.rootStore.bridgeMode === BRIDGE_MODES.ERC_TO_ERC) {
        this.balance = await getTotalSupply(this.tokenContract)
        this.web3Store.getWeb3Promise.then(async () => {
          this.userBalance = await getBalanceOf(this.tokenContract, this.web3Store.defaultAccount.address)
          balanceLoaded()
        })
      } else if (this.rootStore.bridgeMode === BRIDGE_MODES.ERC_TO_NATIVE) {
        const mintedCoins = await mintedTotally(this.blockRewardContract)
        const burntCoins = await totalBurntCoins(this.homeBridge)
        this.balance = fromDecimals(mintedCoins.minus(burntCoins).toString(10),this.tokenDecimals)
      } else {
        this.balance = await getBalance(this.homeWeb3, this.HOME_BRIDGE_ADDRESS)
      }
    } catch(e) {
      console.error(e)
      this.errors.push(e)
    }
  }

  @action
  async getFee() {
    const feeManager = await getFeeManager(this.homeBridge)
    if (feeManager !== ZERO_ADDRESS) {
      const feeManagerModeHash = await getFeeManagerMode(this.homeBridge)
      this.feeManager.feeManagerMode = decodeFeeManagerMode(feeManagerModeHash)

      if(this.feeManager.feeManagerMode === FEE_MANAGER_MODE.BOTH_DIRECTIONS) {
        this.feeManager.homeFee = await getHomeFee(this.homeBridge)
        this.feeManager.foreignFee = await getForeignFee(this.homeBridge)
      } else {
        this.feeManager.homeFee = new BN(0);
        this.feeManager.foreignFee = await getForeignFee(this.homeBridge)
      }
    } else {
      this.feeManager.feeManagerMode = FEE_MANAGER_MODE.UNDEFINED
      this.feeManager.homeFee = new BN(0);
      this.feeManager.foreignFee = new BN(0);
    }
  }

  @action
  async getEvents(fromBlock, toBlock) {
    try {
      fromBlock = fromBlock || this.filteredBlockNumber || this.latestBlockNumber - 50
      toBlock =  toBlock || this.filteredBlockNumber || "latest"

      if (fromBlock < 0) {
        fromBlock = 0
      }

      let events = await getPastEvents(this.homeBridge, fromBlock, toBlock).catch(e => {
        console.error('Couldn\'t get events', e)
        return []
      })

      let homeEvents = []
      await asyncForEach(events, (async (event) => {
        if(event.event === "SignedForUserRequest" || event.event === "CollectedSignatures") {
          event.signedTxHash = await this.getSignedTx(event.returnValues.messageHash)
        }
        homeEvents.push(event)
      }))

      if(!this.filter){
        this.events = homeEvents;
      }

      if(this.waitingForConfirmation.size) {
        const confirmationEvents = homeEvents.filter((event) => event.event === "AffirmationCompleted" && this.waitingForConfirmation.has(event.returnValues.transactionHash))
        confirmationEvents.forEach(event => {
          this.alertStore.setLoadingStepIndex(3)
          const urlExplorer = this.getExplorerTxUrl(event.transactionHash)
          const unitReceived = getUnit(this.rootStore.bridgeMode).unitHome
          setTimeout(() => {
            this.alertStore.pushSuccess(`${unitReceived} received on ${this.networkName} on Tx
              <a href='${urlExplorer}' target='blank' style="overflow-wrap: break-word;word-wrap: break-word;">
              ${event.transactionHash}</a>`, this.alertStore.HOME_TRANSFER_SUCCESS)}
            , 2000)
          this.waitingForConfirmation.delete(event.returnValues.transactionHash)
        })

        if(confirmationEvents.length) {
          removePendingTransaction()
        }
      }

      return homeEvents
    } catch(e) {
      this.alertStore.pushError(`Cannot establish connection to Home Network.\n
                 Please make sure you have set it up in env variables`, this.alertStore.HOME_CONNECTION_ERROR)
    }
  }

  async getSignedTx(messageHash){
    try {
      const message = await getMessage(this.homeBridge, messageHash)
      return "0x" + message.substring(106, 170);
    } catch(e){
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
    const events = await this.getEvents(1,"latest");
    this.events = events.filter((event) => event.returnValues.transactionHash === transactionHash)
  }
  @action
  async filterByTxHash(transactionHash) {
    const events = await this.getEvents(1,"latest");
    this.events = events.filter((event) => event.transactionHash === transactionHash)
    if(this.events.length > 0 && this.events[0].returnValues && this.events[0].returnValues.transactionHash) {
      await this.rootStore.foreignStore.filterByTxHashInReturnValues(this.events[0].returnValues.transactionHash)
    }
  }

  @action
  setFilter(value){
    this.filter = value
  }

  @action
  async setBlockFilter(blockNumber){
    this.filteredBlockNumber = blockNumber
    this.events = await this.getEvents()
  }

  @action
  async getCurrentLimit(){
    try {
      const result = await getCurrentLimit(this.homeBridge,this.tokenDecimals)
      this.maxCurrentDeposit = result.maxCurrentDeposit
      this.dailyLimit = result.dailyLimit
      this.totalSpentPerDay = result.totalSpentPerDay
    } catch(e){
      console.error(e)
    }
  }

  addWaitingForConfirmation(hash) {
    this.waitingForConfirmation.add(hash)
    this.setBlockFilter(0)
    this.rootStore.foreignStore.setBlockFilter(0)
  }

  @action
  async getValidators(){
    try {
      const homeValidatorsAddress = await this.homeBridge.methods.validatorContract().call()
      this.homeBridgeValidators = new this.homeWeb3.eth.Contract(BRIDGE_VALIDATORS_ABI, homeValidatorsAddress);

      this.requiredSignatures = await this.homeBridgeValidators.methods.requiredSignatures().call()
      this.validatorsCount = await this.homeBridgeValidators.methods.validatorCount().call()

      this.validators = await getValidatorList(homeValidatorsAddress, this.homeWeb3.eth)
    } catch(e){
      console.error(e)
    }
  }

  async getStatistics() {
    try {
      const deployedAtBlock = await getDeployedAtBlock(this.homeBridge);
      const { HOME_ABI } = getBridgeABIs(this.rootStore.bridgeMode)
      const abi = [...HomeBridgeV1Abi, ...HOME_ABI]
      const contract = new this.homeWeb3.eth.Contract(abi, this.HOME_BRIDGE_ADDRESS);
      const events = await getPastEvents(contract, deployedAtBlock, 'latest')
      processLargeArrayAsync(
        events,
        this.processEvent,
        () => {
          this.statistics.finished = true
          this.statistics.totalBridged = this.statistics.depositsValue.plus(this.statistics.withdrawsValue)
        })
    } catch(e){
      console.error(e)
      this.getStatistics()
    }
  }

  processEvent = (event) => {
    if(event.returnValues && event.returnValues.recipient) {
      this.statistics.users.add(event.returnValues.recipient)
    }
    if(event.event === "UserRequestForSignature" || event.event === 'Deposit') {
      this.statistics.deposits++
      this.statistics.depositsValue = this.statistics.depositsValue.plus(BN(fromDecimals(event.returnValues.value,this.tokenDecimals)))
    } else if (event.event === "AffirmationCompleted" || event.event === 'Withdraw') {
      this.statistics.withdraws++
      this.statistics.withdrawsValue = this.statistics.withdrawsValue.plus(BN(fromDecimals(event.returnValues.value,this.tokenDecimals)))
    } else if (event.event === "FeeDistributedFromSignatures") {
      this.feeManager.totalFeeDistributedFromSignatures = this.feeManager.totalFeeDistributedFromSignatures.plus(BN(fromDecimals(event.returnValues.feeAmount, this.tokenDecimals)))
    } else if (event.event === "FeeDistributedFromAffirmation") {
      this.feeManager.totalFeeDistributedFromAffirmation = this.feeManager.totalFeeDistributedFromAffirmation.plus(BN(fromDecimals(event.returnValues.feeAmount, this.tokenDecimals)))
    }
  }

  calculateCollectedFees() {
    if (!this.statistics.finished
      || !this.rootStore.foreignStore.feeEventsFinished
      || !this.feeManager.feeManagerMode
      || !this.rootStore.foreignStore.feeManager.feeManagerMode) {
      setTimeout(() => { this.calculateCollectedFees() }, 1000)
      return
    }

    const data = getRewardableData(this.feeManager, this.rootStore.foreignStore.feeManager)

    this.depositFeeCollected.type = data.depositSymbol === 'home' ? this.symbol : this.rootStore.foreignStore.symbol
    this.withdrawFeeCollected.type = data.withdrawSymbol === 'home' ? this.symbol : this.rootStore.foreignStore.symbol
    this.depositFeeCollected.shouldDisplay = data.displayDeposit
    this.withdrawFeeCollected.shouldDisplay = data.displayWithdraw

    this.depositFeeCollected.value = data.depositSymbol === 'home'
      ? this.feeManager.totalFeeDistributedFromSignatures
      : this.rootStore.foreignStore.feeManager.totalFeeDistributedFromSignatures

    this.withdrawFeeCollected.value = data.withdrawSymbol === 'home'
      ? this.feeManager.totalFeeDistributedFromAffirmation
      : this.rootStore.foreignStore.feeManager.totalFeeDistributedFromAffirmation

    this.depositFeeCollected.finished = true
    this.withdrawFeeCollected.finished = true
  }

  getDailyQuotaCompleted() {
    return this.dailyLimit ? this.totalSpentPerDay / this.dailyLimit * 100 : 0
  }

  getDisplayedBalance() {
    return this.rootStore.bridgeMode === BRIDGE_MODES.ERC_TO_ERC ? this.userBalance : this.web3Store.defaultAccount.homeBalance
  }

  async getBlockRewardContract () {
    const blockRewardAddress = await this.homeBridge.methods.blockRewardContract().call()
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
}

export default HomeStore;
