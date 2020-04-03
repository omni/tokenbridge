const axios = require('axios')

let id = 0
const rpc = (url, method, ...params) =>
  axios.post(url, { jsonrpc: '2.0', id: id++, method, params }).then(response => response.result)

module.exports.testRPC = url => async () => {
  try {
    const response = await rpc(url, 'eth_blockNumber')
    return !!response
  } catch (e) {
    return false
  }
}
