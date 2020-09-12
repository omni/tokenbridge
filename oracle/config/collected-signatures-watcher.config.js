const baseConfig = require('./base.config')

const id = `${baseConfig.id}-collected-signatures`

module.exports = {
  ...baseConfig.bridgeConfig,
  ...baseConfig.homeConfig,
  event: 'CollectedSignatures',
  queue: 'foreign-prioritized',
  name: `watcher-${id}`,
  id
}
