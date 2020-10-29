const fs = require('fs')
const BigNumber = require('bignumber.js')
const promiseRetry = require('promise-retry')
const Web3 = require('web3')

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

async function waitForFunds(web3, address, minimumBalance, cb, logger) {
  promiseRetry(
    async retry => {
      logger.debug('Getting balance of validator account')
      const newBalance = web3.utils.toBN(await web3.eth.getBalance(address))
      if (newBalance.gte(web3.utils.toBN(minimumBalance.toString(10)))) {
        logger.debug({ balance: newBalance, minimumBalance }, 'Validator has minimum necessary balance')
        cb(newBalance)
      } else {
        logger.debug({ balance: newBalance, minimumBalance }, 'Balance of validator is still less than the minimum')
        retry()
      }
    },
    {
      forever: true,
      factor: 1
    }
  )
}

function addExtraGas(gas, extraPercentage, maxGasLimit = Infinity) {
  gas = BigNumber(gas)
  extraPercentage = BigNumber(1 + extraPercentage)

  const gasWithExtra = gas.multipliedBy(extraPercentage).toFixed(0)

  return BigNumber.min(maxGasLimit, gasWithExtra)
}

function setIntervalAndRun(f, interval) {
  const handler = setInterval(f, interval)
  f()
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

function nonceError(e) {
  const message = e.message.toLowerCase()
  return (
    message.includes('transaction nonce is too low') ||
    message.includes('nonce too low') ||
    message.includes('transaction with same nonce in the queue')
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

module.exports = {
  syncForEach,
  checkHTTPS,
  waitForFunds,
  addExtraGas,
  setIntervalAndRun,
  watchdog,
  privateKeyToAddress,
  nonceError,
  getRetrySequence,
  promiseAny,
  readAccessListFile
}
