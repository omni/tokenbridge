const baseConfig = require('./base.config')
const { web3ForeignArchive } = require('../src/services/web3')

const id = `${baseConfig.id}-information-request`

module.exports = {
  ...baseConfig,
  web3ForeignArchive: web3ForeignArchive || baseConfig.foreign.web3,
  main: baseConfig.home,
  event: 'UserRequestForInformation',
  sender: 'home',
  queue: 'home-prioritized',
  name: `watcher-${id}`,
  id
}
