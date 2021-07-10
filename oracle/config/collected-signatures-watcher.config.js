const baseConfig = require('./base.config')

const id = `${baseConfig.id}-collected-signatures`

module.exports = {
  ...baseConfig,
  main: baseConfig.home,
  event: 'CollectedSignatures',
  sender: 'foreign',
  queue: 'foreign-prioritized',
  name: `watcher-${id}`,
  id
}
