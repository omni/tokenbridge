const fetch = require('node-fetch')
const promiseRetry = require('promise-retry')
const { utils } = require('web3')
const { FALLBACK_RPC_URL_SWITCH_TIMEOUT } = require('../utils/constants')

const { onInjected } = require('./injectedLogger')

const { ORACLE_JSONRPC_ERROR_CODES } = process.env

// From EIP-1474 and Infura documentation
const JSONRPC_ERROR_CODES = ORACLE_JSONRPC_ERROR_CODES
  ? ORACLE_JSONRPC_ERROR_CODES.split(',').map(s => parseInt(s, 10))
  : [-32603, -32002, -32005]

const defaultOptions = {
  name: 'main',
  requestTimeout: 0,
  retry: {
    retries: 0
  }
}

class HttpListProviderError extends Error {
  constructor(message, errors) {
    super(message)
    this.errors = errors
  }
}

function HttpListProvider(urls, options = {}) {
  if (!(this instanceof HttpListProvider)) {
    return new HttpListProvider(urls)
  }

  if (!urls || !urls.length) {
    throw new TypeError(`Invalid URLs: '${urls}'`)
  }

  this.urls = urls
  this.options = { ...defaultOptions, ...options }
  this.currentIndex = 0
  this.lastTimeUsedPrimary = 0
  this.latestBlock = 0
  this.syncStateCheckerIntervalId = 0

  onInjected(logger => {
    this.logger = logger.child({ module: `HttpListProvider:${this.options.name}` })
  })
}

HttpListProvider.prototype.startSyncStateChecker = function(syncCheckInterval) {
  if (this.urls.length > 1 && syncCheckInterval > 0 && this.syncStateCheckerIntervalId === 0) {
    this.syncStateCheckerIntervalId = setInterval(this.checkLatestBlock.bind(this), syncCheckInterval)
  }
}

HttpListProvider.prototype.checkLatestBlock = function() {
  const payload = { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }
  this.send(payload, (error, result) => {
    if (error) {
      this.logger.warn({ oldBlock: this.latestBlock }, 'Failed to request latest block from all RPC urls')
    } else if (result.error) {
      this.logger.warn(
        { oldBlock: this.latestBlock, error: result.error.message },
        'Failed to make eth_blockNumber request due to unknown error, switching to fallback RPC'
      )
      this.switchToFallbackRPC()
    } else {
      const blockNumber = utils.hexToNumber(result.result)
      if (blockNumber > this.latestBlock) {
        this.logger.debug({ oldBlock: this.latestBlock, newBlock: blockNumber }, 'Updating latest block number')
        this.latestBlock = blockNumber
      } else {
        this.logger.warn(
          { oldBlock: this.latestBlock, newBlock: blockNumber },
          'Latest block on the node was not updated since last request, switching to fallback RPC'
        )
        this.switchToFallbackRPC()
      }
    }
  })
}

HttpListProvider.prototype.switchToFallbackRPC = function(index) {
  const prevIndex = this.currentIndex
  const newIndex = index || (prevIndex + 1) % this.urls.length
  if (this.urls.length < 2 || prevIndex === newIndex) {
    return
  }

  this.logger.info(
    { index: newIndex, oldURL: this.urls[prevIndex], newURL: this.urls[newIndex] },
    'Switching to fallback JSON-RPC URL'
  )
  this.currentIndex = newIndex
}

HttpListProvider.prototype.send = async function send(payload, callback) {
  // if fallback URL is being used for too long, switch back to the primary URL
  if (this.currentIndex > 0 && Date.now() - this.lastTimeUsedPrimary > FALLBACK_RPC_URL_SWITCH_TIMEOUT) {
    this.logger.info(
      { oldURL: this.urls[this.currentIndex], newURL: this.urls[0] },
      'Switching back to the primary JSON-RPC URL'
    )
    this.currentIndex = 0
  }

  // save the currentIndex to avoid race condition
  const { currentIndex } = this

  try {
    const [result, index] = await promiseRetry(
      retry => this.trySend(payload, currentIndex).catch(retry),
      this.options.retry
    )

    // if some of URLs failed to respond, current URL index is updated to the first URL that responded
    if (currentIndex !== index) {
      this.switchToFallbackRPC(index)
    }
    callback(null, result)
  } catch (e) {
    callback(e)
  }
}

HttpListProvider.prototype.trySend = async function(payload, initialIndex) {
  const errors = []

  for (let count = 0; count < this.urls.length; count++) {
    const index = (initialIndex + count) % this.urls.length

    // when request is being sent to the primary URL, the corresponding time marker is updated
    if (index === 0) {
      this.lastTimeUsedPrimary = Date.now()
    }

    const url = this.urls[index]
    try {
      const result = await send(url, payload, this.options)
      return [result, index]
    } catch (e) {
      this.logger.debug({ index, url, method: payload.method, error: e.message }, `JSON-RPC has failed to respond`)
      errors.push(e)
    }
  }

  throw new HttpListProviderError('Request failed for all urls', errors)
}

function send(url, payload, options) {
  return fetch(url, {
    headers: {
      'Content-type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify(payload),
    timeout: options.requestTimeout
  })
    .then(response => {
      if (response.ok) {
        return response
      } else {
        throw new Error(response.statusText)
      }
    })
    .then(response => response.json())
    .then(response => {
      if (
        response.error &&
        (JSONRPC_ERROR_CODES.includes(response.error.code) || response.error.message.includes('ancient block'))
      ) {
        throw new Error(response.error.message)
      }
      return response
    })
}

module.exports = {
  HttpListProvider,
  HttpListProviderError,
  defaultOptions,
  send
}
