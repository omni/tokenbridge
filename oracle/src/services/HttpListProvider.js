const fetch = require('node-fetch')
const promiseRetry = require('promise-retry')

let logger
try {
  // eslint-disable-next-line global-require
  logger = require('./logger').child({
    module: 'HttpListProvider'
  })
} catch (e) {
  logger = {
    debug: () => {},
    info: () => {}
  }
}

// From EIP-1474 and Infura documentation
const JSONRPC_ERROR_CODES = [-32603, -32002, -32005]

const defaultOptions = {
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
}

HttpListProvider.prototype.send = async function send(payload, callback) {
  // save the currentIndex to avoid race condition
  const { currentIndex } = this

  try {
    const [result, index] = await promiseRetry(retry => {
      return trySend(payload, this.urls, currentIndex, this.options).catch(retry)
    }, this.options.retry)
    if (currentIndex !== index) {
      logger.info(
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

async function trySend(payload, urls, initialIndex, options) {
  const errors = []

  let index = initialIndex
  for (let count = 0; count < urls.length; count++) {
    const url = urls[index]
    try {
      const result = await send(url, payload, options)
      return [result, index]
    } catch (e) {
      logger.debug({ index, url, error: e.message }, `JSON-RPC has failed to respond`)
      errors.push(e)
    }
    index = (index + 1) % urls.length
  }

  throw new HttpListProviderError('Request failed for all urls', errors)
}

module.exports = {
  HttpListProvider,
  HttpListProviderError,
  defaultOptions,
  send
}
