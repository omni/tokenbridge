const fetch = require('node-fetch')
const promiseRetry = require('promise-retry')

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
    this.currentIndex = index
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
