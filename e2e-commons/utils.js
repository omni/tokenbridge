const promiseRetry = require('promise-retry')

async function uniformRetry(f) {
  return promiseRetry(f, {
    forever: true,
    factor: 1,
    minTimeout: 500
  })
}

async function sleep(timeout) {
  return new Promise(res => setTimeout(res, timeout))
}

module.exports = {
  uniformRetry,
  sleep
}
