const fetch = require('node-fetch')
const promiseRetry = require('promise-retry')
const { FALLBACK_RPC_URL_SWITCH_TIMEOUT } = require('../utils/constants')

// From EIP-1474 and Infura documentation
const JSONRPC_ERROR_CODES = [-32603, -32002, -32005]

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
  this.logger = {
    debug: () => {},
    info: () => {}
  }
}

HttpListProvider.prototype.setLogger = function(logger) {
  this.logger = logger.child({ module: `HttpListProvider:${this.options.name}` })
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
      this.logger.info(
        { index, oldURL: this.urls[currentIndex], newURL: this.urls[index] },
        'Switching to fallback JSON-RPC URL'
      )
      this.currentIndex = index
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
