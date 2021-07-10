const baseConfig = require('./base.config')

const id = `${baseConfig.id}-affirmation-request`

module.exports = {
  ...baseConfig,
  main: baseConfig.foreign,
  event: 'UserRequestForAffirmation',
  sender: 'home',
  queue: 'home-prioritized',
  name: `watcher-${id}`,
  id
}
