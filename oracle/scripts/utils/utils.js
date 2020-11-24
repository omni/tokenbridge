const { fromWei } = require('web3').utils

async function getMinPerTxLimit(bridge) {
  const minPerTx = await bridge.methods.minPerTx().call()
  return fromWei(minPerTx)
}

async function isValidAmount(amount, bridge) {
  const minLimit = await getMinPerTxLimit(bridge)
  if (amount < minLimit) {
    throw new Error(`The amount per Tx ${amount} should be at least ${minLimit}`)
  }
}

module.exports = {
  getMinPerTxLimit,
  isValidAmount
}
