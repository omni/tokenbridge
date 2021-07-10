const { hexToNumber, isHexStrict } = require('web3').utils

const { onInjected } = require('./injectedLogger')

function SafeEthLogsProvider(provider) {
  this.subProvider = provider
  onInjected(logger => {
    this.logger = logger.child({ module: 'SafeEthLogsProvider' })
  })
}

SafeEthLogsProvider.prototype.send = function send(payload, callback) {
  if (payload.method === 'eth_getLogs' && isHexStrict(payload.params[0].toBlock)) {
    this.logger.debug('Modifying eth_getLogs request to include batch eth_blockNumber request')

    const newPayload = [payload, { jsonrpc: '2.0', id: payload.id + 1, method: 'eth_blockNumber', params: [] }]
    this.subProvider.send(newPayload, (err, res) => {
      if (err) {
        callback(err, null)
      } else {
        const rawLogs = res.find(({ id }) => id === payload.id)
        const rawBlockNumber = res.find(({ id }) => id === payload.id + 1)
        const blockNumber = hexToNumber(rawBlockNumber.result)
        const toBlock = hexToNumber(payload.params[0].toBlock)

        if (blockNumber < toBlock) {
          this.logger.warn({ toBlock, blockNumber }, 'Returned block number is less than the specified toBlock')
          callback(new Error('block number too low'), null)
        } else {
          callback(null, rawLogs)
        }
      }
    })
  } else {
    this.subProvider.send(payload, callback)
  }
}

module.exports = {
  SafeEthLogsProvider
}
