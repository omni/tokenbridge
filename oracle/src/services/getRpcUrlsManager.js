const RpcUrlsManager = require('./RpcUrlsManager')

module.exports = new RpcUrlsManager(process.env.HOME_RPC_URL, process.env.FOREIGN_RPC_URL)
