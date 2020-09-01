const promiseRetry = require('promise-retry')
const tryEach = require('../utils/tryEach')
const { RETRY_CONFIG } = require('../utils/constants')
const { promiseAny } = require('../utils/utils')

function RpcUrlsManager(homeUrls, foreignUrls) {
  if (!homeUrls) {
    throw new Error(`Invalid homeUrls: '${homeUrls}'`)
  }
  if (!foreignUrls) {
    throw new Error(`Invalid foreignUrls: '${foreignUrls}'`)
  }

  this.homeUrls = homeUrls.split(' ')
  this.foreignUrls = foreignUrls.split(' ')
}

RpcUrlsManager.prototype.tryEach = async function(chain, f, redundant = false) {
  if (chain !== 'home' && chain !== 'foreign') {
    throw new Error(`Invalid argument chain: '${chain}'`)
  }

  // save urls to avoid race condition
  const urls = chain === 'home' ? [...this.homeUrls] : [...this.foreignUrls]

  if (redundant) {
    // result from first responded node will be returned immediately
    // remaining nodes will continue to retry queries in separate promises
    // promiseAny will throw only if all urls reached max retry number
    return promiseAny(urls.map(url => promiseRetry(retry => f(url).catch(retry), RETRY_CONFIG)))
  }

  const [result, index] = await promiseRetry(retry => tryEach(urls, f).catch(retry), RETRY_CONFIG)

  if (index > 0) {
    // rotate urls
    const failed = urls.splice(0, index)
    urls.push(...failed)
  }

  if (chain === 'home') {
    this.homeUrls = urls
  } else {
    this.foreignUrls = urls
  }

  return result
}

module.exports = RpcUrlsManager
