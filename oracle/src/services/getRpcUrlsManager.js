const RpcUrlsManager = require('./RpcUrlsManager')

module.exports = new RpcUrlsManager(process.env.COMMON_HOME_RPC_URL, process.env.COMMON_FOREIGN_RPC_URL)
