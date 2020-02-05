const promiseRetry = require('promise-retry')

function generateNewBlock(web3, address) {
  return web3.eth.sendTransaction({
    from: address,
    to: '0x0000000000000000000000000000000000000000',
    gasPrice: '1',
    gas: '21000',
    value: '1'
  })
}

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
  generateNewBlock,
  uniformRetry,
  sleep
}
