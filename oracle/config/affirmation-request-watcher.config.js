const baseConfig = require('./base.config')

const id = `${baseConfig.id}-affirmation-request`

module.exports = {
  ...baseConfig.bridgeConfig,
  ...baseConfig.foreignConfig,
  event: 'UserRequestForAffirmation',
  queue: 'home-prioritized',
  name: `watcher-${id}`,
  id
}
