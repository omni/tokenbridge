const baseConfig = require('./base.config')

const id = `${baseConfig.id}-information-request`

module.exports = {
  ...baseConfig,
  main: baseConfig.home,
  event: 'UserRequestForInformation',
  sender: 'home',
  queue: 'home-prioritized',
  name: `watcher-${id}`,
  id
}
