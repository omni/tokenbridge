import { action, observable } from "mobx";

class AlertStore {
  @observable alerts = [];
  @observable showLoading = false;
  @observable loadingStepIndex = -1;
  @observable blockConfirmations = 0
  @observable showDailyQuotaInfo = false
  homeConnectionErrorSended = false
  foreignConnectionErrorSended = false

  loadingSteps = [
    'Loading',
    'Waiting for Block Confirmations...',
    'Validators Verifying Transaction...',
    'Transfer Complete'
  ];
  HOME_CONNECTION_ERROR = 'Home Connection Error'
  FOREIGN_CONNECTION_ERROR = 'Foreign Connection Error'
  HOME_TRANSFER_SUCCESS = 'Home Transfer Success'
  FOREIGN_TRANSFER_SUCCESS = 'Foreign Transfer Success'

  @action
  pushError(message, messageType){
    console.error("Error: ", message)
    const shouldPushError = this.checkErrorPush(messageType, messageType)
    if(shouldPushError) {
      const node = document.createElement("div")
      node.innerHTML = message
      const error = {
        title: "Error",
        content: node,
        icon: "error",
        messageType
      }
      this.alerts.push(error)
    }
  }

  checkErrorPush(message, messageType){
    if(messageType === this.HOME_CONNECTION_ERROR) {
      if(this.homeConnectionErrorSended) {
        return false
      } else {
        this.homeConnectionErrorSended = true
        return true
      }
    } else if(messageType === this.FOREIGN_CONNECTION_ERROR) {
      if(this.foreignConnectionErrorSended) {
        return false
      } else {
        this.foreignConnectionErrorSended = true
        return true
      }
    } else {
      return true
    }

  }

  @action
  pushSuccess(message, messageType){
    const node = document.createElement("div")
    node.innerHTML = message
    const success = {
      title: "Success",
      content: node,
      icon: "success",
      messageType
    }
    this.alerts.push(success)
  }

  remove(value){
    const result = this.alerts.remove(value);
    console.log(result, value, this.alerts)
  }

  @action
  setLoading(status) {
    this.showLoading = status;
    this.loadingStepIndex = 0;
    this.blockConfirmations = 0
  }

  @action
  setBlockConfirmations(blocks) {
    this.blockConfirmations = blocks
  }

  @action
  setLoadingStepIndex(index) {
    this.loadingStepIndex = index;
    console.log(this.loadingSteps[index])
    if(index === this.loadingSteps.length - 1) {
      setTimeout(() => { this.setLoading(false)}, 2000)
    }
  }

  shouldDisplayLoadingSteps() {
    return this.loadingStepIndex !== -1
  }

  @action
  setShowDailyQuotaInfo(value) {
    this.showDailyQuotaInfo = value
  }

}

export default AlertStore;
