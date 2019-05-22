let balanceCount = 0
let pendingTransaction = 0

export const balanceLoaded = () => {
  balanceCount++
  if (balanceCount > 1) {
    document.getElementById('root').classList.add('web3-loaded')
  }
}

export const addPendingTransaction = () => {
  pendingTransaction++
  document.getElementById('root').classList.add('pending-transaction')
}

export const removePendingTransaction = () => {
  pendingTransaction--
  if (!pendingTransaction) {
    document.getElementById('root').classList.remove('pending-transaction')
  }
}
