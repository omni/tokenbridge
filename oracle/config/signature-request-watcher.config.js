const baseConfig = require('./base.config')

const id = `${baseConfig.id}-signature-request`

module.exports = {
  ...baseConfig,
  main: baseConfig.home,
  event: 'UserRequestForSignature',
  queue: 'home-prioritized',
  name: `watcher-${id}`,
  id
}
