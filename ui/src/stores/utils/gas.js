const { gasPriceFromOracle } = require('../../../../commons')

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

export async function fetchGasPriceFromOracle(oracleUrl, speedType, factor) {
  if (!oracleUrl) {
    throw new Error(`Gas Price Oracle url not defined`)
  }
  const fetchFn = () => fetch(oracleUrl)
  return gasPriceFromOracle(fetchFn, speedType, factor)
}
