const baseConfig = require('./base.config')

const id = `${baseConfig.id}-collected-signatures`

const config = {
  ...baseConfig.bridgeConfig,
  ...baseConfig.homeConfig,
  event: 'CollectedSignatures',
  queue: 'foreign-prioritized',
  name: `watcher-${id}`,
  id
}

if (baseConfig.id === 'erc-native') {
  config.accessLists = {
    blockList: '/mono/oracle/access-lists/block_list.txt',
    allowanceList: '/mono/oracle/access-lists/allowance_list.txt'
  }
}

module.exports = config
