const fs = require('fs')
const BigNumber = require('bignumber.js')
const promiseRetry = require('promise-retry')
const Web3 = require('web3')
const { GAS_PRICE_BOUNDARIES } = require('./constants')

const { toBN, toWei } = Web3.utils

const retrySequence = [1, 2, 3, 5, 8, 13, 21, 34, 55, 60]

function getRetrySequence(count) {
  return count > retrySequence.length ? retrySequence[retrySequence.length - 1] : retrySequence[count - 1]
}

async function syncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

function checkHTTPS(ORACLE_ALLOW_HTTP_FOR_RPC, logger) {
  return function(network) {
    return function(url) {
      if (!/^https.*/.test(url)) {
        if (ORACLE_ALLOW_HTTP_FOR_RPC !== 'yes') {
          throw new Error(`http is not allowed: ${url}`)
        } else {
          logger.warn(`You are using http (${url}) on ${network} network. In production https must be used instead.`)
        }
      }
    }
  }
}

const promiseRetryForever = f => promiseRetry(f, { forever: true, factor: 1 })

async function waitForFunds(web3, address, minimumBalance, cb, logger) {
  promiseRetryForever(async retry => {
    logger.debug('Getting balance of validator account')
    const newBalance = toBN(await web3.eth.getBalance(address))
    if (newBalance.gte(toBN(minimumBalance.toString(10)))) {
      logger.debug({ balance: newBalance, minimumBalance }, 'Validator has minimum necessary balance')
      cb(newBalance)
    } else {
      logger.debug({ balance: newBalance, minimumBalance }, 'Balance of validator is still less than the minimum')
      retry()
    }
  })
}

async function waitForUnsuspend(getSuspendFlag, cb) {
  promiseRetryForever(async retry => {
    if (await getSuspendFlag()) {
      retry()
    } else {
      cb()
    }
  })
}

function addExtraGas(gas, extraPercentage, maxGasLimit = Infinity) {
  gas = BigNumber(gas)
  extraPercentage = BigNumber(1 + extraPercentage)

  const gasWithExtra = gas.multipliedBy(extraPercentage).toFixed(0)

  return BigNumber.min(maxGasLimit, gasWithExtra)
}

function applyMinGasFeeBump(job, bumpFactor = 0.1) {
  if (!job.gasPriceOptions) {
    return job
  }
  const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = job.gasPriceOptions
  const maxGasPrice = toWei(GAS_PRICE_BOUNDARIES.MAX.toString(), 'gwei')
  if (gasPrice) {
    return {
      ...job,
      gasPriceOptions: {
        gasPrice: addExtraGas(gasPrice, bumpFactor, maxGasPrice).toString()
      }
    }
  }
  if (maxFeePerGas && maxPriorityFeePerGas) {
    return {
      ...job,
      gasPriceOptions: {
        maxFeePerGas: addExtraGas(maxFeePerGas, bumpFactor, maxGasPrice).toString(),
        maxPriorityFeePerGas: addExtraGas(maxPriorityFeePerGas, bumpFactor, maxGasPrice).toString()
      }
    }
  }
  return job
}

function chooseGasPriceOptions(a, b) {
  if (!a) {
    return b
  }
  if (a && b && a.gasPrice && b.gasPrice) {
    return { gasPrice: BigNumber.max(a.gasPrice, b.gasPrice).toString() }
  }
  if (a && b && a.maxFeePerGas && b.maxFeePerGas && a.maxPriorityFeePerGas && b.maxPriorityFeePerGas) {
    return {
      maxFeePerGas: BigNumber.max(a.maxFeePerGas, b.maxFeePerGas).toString(),
      maxPriorityFeePerGas: BigNumber.max(a.maxPriorityFeePerGas, b.maxPriorityFeePerGas).toString()
    }
  }
  return a
}

async function setIntervalAndRun(f, interval) {
  const handler = setInterval(f, interval)
  await f()
  return handler
}

/**
 * Run function `f` and return its result, unless `timeout` milliseconds pass before `f` ends. If that happens, run
 * `kill` instead.
 *
 * @param {Function} f The function to run. It is assumed that it's an async function.
 * @param {Number} timeout Max time in milliseconds to wait for `f` to finish.
 * @param {Function} kill Function that will be called if `f` takes more than `timeout` milliseconds.
 */
async function watchdog(f, timeout, kill) {
  const timeoutHandler = setTimeout(kill, timeout)

  const result = await f()
  clearTimeout(timeoutHandler)

  return result
}

function add0xPrefix(s) {
  if (s.indexOf('0x') === 0) {
    return s
  }

  return `0x${s}`
}

function privateKeyToAddress(privateKey) {
  return privateKey ? new Web3().eth.accounts.privateKeyToAccount(add0xPrefix(privateKey)).address : null
}

function isGasPriceError(e) {
  const message = e.message.toLowerCase()
  return message.includes('replacement transaction underpriced')
}

function isSameTransactionError(e) {
  const message = e.message.toLowerCase()
  return (
    message.includes('transaction with the same hash was already imported') ||
    message.includes('already known') ||
    message.includes('alreadyknown')
  )
}

function isInsufficientBalanceError(e) {
  const message = e.message.toLowerCase()
  return message.includes('insufficient funds')
}

function isNonceError(e) {
  const message = e.message.toLowerCase()
  return (
    message.includes('transaction nonce is too low') ||
    message.includes('nonce too low') ||
    message.includes('transaction with same nonce in the queue') ||
    message.includes('oldnonce') ||
    message.includes(`the tx doesn't have the correct nonce`)
  )
}

function isRevertError(e) {
  const message = e.message.toLowerCase()
  // OE and NE returns "VM execution error"/"Transaction execution error"
  // Geth returns "out of gas"/"intrinsic gas too low"/"execution reverted"
  return (
    message.includes('execution error') ||
    message.includes('intrinsic gas too low') ||
    message.includes('out of gas') ||
    message.includes('execution reverted')
  )
}

// Promise.all rejects on the first rejected Promise or fulfills with the list of results
// inverted Promise.all fulfills with the first obtained result or rejects with the list of errors
const invert = p => new Promise((res, rej) => p.then(rej, res))
const promiseAny = ps => invert(Promise.all(ps.map(invert)))

const readAccessLists = {}
async function readAccessListFile(fileName, logger) {
  if (!readAccessLists[fileName]) {
    logger.debug({ fileName }, 'Access list file read requested')
    try {
      const data = await fs.promises.readFile(fileName)
      readAccessLists[fileName] = data
        .toString()
        .split('\n')
        .map(addr => addr.trim().toLowerCase())
        .filter(addr => addr.length === 42)
      logger.info(
        { fileName },
        `Access list was read successfully, ${readAccessLists[fileName].length} addresses found`
      )
      logger.debug({ addresses: readAccessLists[fileName] }, `Read addresses from the file`)
    } catch (e) {
      readAccessLists[fileName] = []
      logger.error({ fileName, error: e }, `Failed to read access list from the file`)
    }
  }
  return readAccessLists[fileName]
}

function zipToObject(keys, values) {
  const res = {}
  keys.forEach((key, i) => {
    res[key] = values[i]
  })
  return res
}

module.exports = {
  syncForEach,
  checkHTTPS,
  waitForFunds,
  waitForUnsuspend,
  addExtraGas,
  chooseGasPriceOptions,
  applyMinGasFeeBump,
  setIntervalAndRun,
  watchdog,
  add0xPrefix,
  privateKeyToAddress,
  isGasPriceError,
  isSameTransactionError,
  isInsufficientBalanceError,
  isNonceError,
  isRevertError,
  getRetrySequence,
  promiseAny,
  readAccessListFile,
  zipToObject
}
