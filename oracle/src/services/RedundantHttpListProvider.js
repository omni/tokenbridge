const promiseRetry = require('promise-retry')
const { promiseAny } = require('../utils/utils')
const { defaultOptions, HttpListProviderError, send } = require('./HttpListProvider')

function RedundantHttpListProvider(urls, options = {}) {
  if (!(this instanceof RedundantHttpListProvider)) {
    return new RedundantHttpListProvider(urls)
  }

  if (!urls || !urls.length) {
    throw new TypeError(`Invalid URLs: '${urls}'`)
  }

  this.urls = urls
  this.options = { ...defaultOptions, ...options }
}

RedundantHttpListProvider.prototype.setLogger = function(logger) {
  this.logger = logger.child({ module: `RedundantHttpListProvider:${this.options.name}` })
}

RedundantHttpListProvider.prototype.send = async function send(payload, callback) {
  try {
    const result = await promiseRetry(retry => {
      return trySend(payload, this.urls, this.options).catch(retry)
    }, this.options.retry)
    callback(null, result)
  } catch (e) {
    callback(e)
  }
}

async function trySend(payload, urls, options) {
  try {
    return await promiseAny(urls.map(url => send(url, payload, options)))
  } catch (errors) {
    throw new HttpListProviderError('Request failed for all urls', errors)
  }
}

module.exports = {
  RedundantHttpListProvider
}
