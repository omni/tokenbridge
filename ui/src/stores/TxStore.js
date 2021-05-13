import { action, observable } from 'mobx'
import { estimateGas } from './utils/web3'
import { addPendingTransaction, removePendingTransaction } from './utils/testUtils'
import { getUnit } from '../../../commons'
import yn from '../components/utils/yn'

class TxStore {
  @observable
  txsValues = {}

  constructor(rootStore) {
    this.web3Store = rootStore.web3Store
    this.gasPriceStore = rootStore.gasPriceStore
    this.alertStore = rootStore.alertStore
    this.foreignStore = rootStore.foreignStore
    this.homeStore = rootStore.homeStore
    this.rootStore = rootStore
  }

  @action
  async doSend({ to, from, value, data, sentValue }) {
    return this.web3Store.getWeb3Promise.then(async () => {
      if (!this.web3Store.defaultAccount) {
        this.alertStore.pushError('Please unlock wallet')
        return
      }
      try {
        const requiredConfirmations =
          this.web3Store.metamaskNet.id === this.web3Store.homeNet.id
            ? this.homeStore.requiredBlockConfirmations
            : this.foreignStore.requiredBlockConfirmations
        const gasPrice = this.gasPriceStore.gasPriceInHex
        const gas = await estimateGas(this.web3Store.injectedWeb3, to, gasPrice, from, value, data)
        return this.web3Store.injectedWeb3.eth
          .sendTransaction({
            to,
            gasPrice,
            gas,
            from,
            value,
            data,
            chainId: this.web3Store.metamaskNet.id
          })
          .on('transactionHash', hash => {
            this.txsValues[hash] = sentValue
            this.alertStore.setRequiredBlockConfirmations(requiredConfirmations)
            this.alertStore.setLoadingStepIndex(1)
            addPendingTransaction()
            this.getTxReceipt(hash)
          })
          .on('error', e => {
            if (
              !e.message.includes('not mined within 50 blocks') &&
              !e.message.includes('Failed to subscribe to new newBlockHeaders')
            ) {
              this.alertStore.setLoading(false)
              this.alertStore.pushError('Transaction rejected on wallet')
            }
          })
      } catch (e) {
        this.alertStore.pushError(e.message)
      }
    })
  }

  @action
  async erc677transferAndCall({ to, from, value, contract, tokenAddress }) {
    try {
      return this.web3Store.getWeb3Promise.then(async () => {
        if (this.web3Store.defaultAccount.address) {
          const data = await contract.methods.transferAndCall(to, value, '0x').encodeABI()
          return this.doSend({ to: tokenAddress, from, value: '0x00', data, sentValue: value })
        } else {
          this.alertStore.pushError('Please unlock wallet')
        }
      })
    } catch (e) {
      this.alertStore.pushError(e)
    }
  }

  @action
  async erc20transfer({ to, from, value }) {
    try {
      return this.web3Store.getWeb3Promise.then(async () => {
        if (this.web3Store.defaultAccount.address) {
          const data = await this.foreignStore.tokenContract.methods
            .transfer(to, value)
            .encodeABI({ from: this.web3Store.defaultAccount.address })
          return this.doSend({
            to: this.foreignStore.tokenAddress,
            from,
            value: '0x',
            data,
            sentValue: value
          })
        } else {
          this.alertStore.pushError('Please unlock wallet')
        }
      })
    } catch (e) {
      this.alertStore.pushError(e)
    }
  }

  async getTxReceipt(hash) {
    const web3 = this.web3Store.injectedWeb3
    web3.eth.getTransaction(hash, (error, res) => {
      if (res && res.blockNumber) {
        this.getTxStatus(hash)
      } else {
        setTimeout(() => {
          this.getTxReceipt(hash)
        }, 5000)
      }
    })
  }

  async getTxStatus(hash) {
    const web3 = this.web3Store.injectedWeb3
    web3.eth.getTransactionReceipt(hash, (error, res) => {
      if (res && res.blockNumber) {
        if (this.isStatusSuccess(res)) {
          if (this.web3Store.metamaskNet.id === this.web3Store.homeNet.id) {
            const blockConfirmations = this.homeStore.latestBlockNumber - res.blockNumber
            if (blockConfirmations >= this.homeStore.requiredBlockConfirmations) {
              this.alertStore.setBlockConfirmations(this.homeStore.requiredBlockConfirmations)
              this.alertStore.setLoadingStepIndex(2)

              if (yn(process.env.REACT_APP_UI_FOREIGN_WITHOUT_EVENTS)) {
                this.foreignStore.waitUntilProcessed(hash).then(() => {
                  this.alertStore.setLoadingStepIndex(3)
                  const unitReceived = getUnit(this.rootStore.bridgeMode).unitForeign
                  setTimeout(() => {
                    this.alertStore.pushSuccess(
                      `${unitReceived} received on ${this.foreignStore.networkName}`,
                      this.alertStore.FOREIGN_TRANSFER_SUCCESS
                    )
                  }, 2000)
                  removePendingTransaction()
                })
              } else {
                this.foreignStore.addWaitingForConfirmation(hash, res)
              }
            } else {
              if (blockConfirmations > 0) {
                this.alertStore.setBlockConfirmations(blockConfirmations)
              }
              this.getTxStatus(hash)
            }
          } else {
            const blockConfirmations = this.foreignStore.latestBlockNumber - res.blockNumber
            if (blockConfirmations >= this.foreignStore.requiredBlockConfirmations) {
              this.alertStore.setBlockConfirmations(this.foreignStore.requiredBlockConfirmations)
              this.alertStore.setLoadingStepIndex(2)

              if (yn(process.env.REACT_APP_UI_HOME_WITHOUT_EVENTS)) {
                this.homeStore.waitUntilProcessed(hash, this.txsValues[hash]).then(() => {
                  this.alertStore.setLoadingStepIndex(3)
                  const unitReceived = getUnit(this.rootStore.bridgeMode).unitHome
                  setTimeout(() => {
                    this.alertStore.pushSuccess(
                      `${unitReceived} received on ${this.homeStore.networkName}`,
                      this.alertStore.HOME_TRANSFER_SUCCESS
                    )
                  }, 2000)
                  removePendingTransaction()
                })
              } else {
                this.homeStore.addWaitingForConfirmation(hash, res)
              }
            } else {
              if (blockConfirmations > 0) {
                this.alertStore.setBlockConfirmations(blockConfirmations)
              }
              this.getTxStatus(hash)
            }
          }
        } else {
          this.alertStore.setLoading(false)
          this.alertStore.pushError(`${hash} Mined but with errors. Perhaps out of gas`)
        }
      } else {
        this.getTxStatus(hash)
      }
    })
  }

  isStatusSuccess(tx) {
    const { toBN } = this.web3Store.injectedWeb3.utils
    const statusSuccess = tx.status && (tx.status === true || toBN(tx.status).eq(toBN(1)))
    const eventEmitted = tx.logs && tx.logs.length
    return statusSuccess || eventEmitted
  }
}

export default TxStore
