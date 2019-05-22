const { toWei } = require('web3-utils')

export async function fetchGasPrice({ oracleFn }) {
  let gasPrice = null
  try {
    gasPrice = await oracleFn()
  } catch (e) {
    if (!e.message.includes('Gas Price Oracle url not defined')) {
      console.error(`Gas Price API is not available. ${e.message}`)
    }
  }
  return gasPrice
}

export async function fetchGasPriceFromOracle(oracleUrl, speedType) {
  if (!oracleUrl) {
    throw new Error(`Gas Price Oracle url not defined`)
  }
  const response = await fetch(oracleUrl)
  const json = await response.json()
  const gasPrice = json[speedType]
  if (!gasPrice) {
    throw new Error(`Response from Oracle didn't include gas price for ${speedType} type.`)
  }
  return toWei(gasPrice.toString(), 'gwei')
}
