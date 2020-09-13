const baseConfig = require('./base.config')

const id = `${baseConfig.id}-signature-request`

module.exports = {
  ...baseConfig.bridgeConfig,
  ...baseConfig.homeConfig,
  event: 'UserRequestForSignature',
  queue: 'home-prioritized',
  name: `watcher-${id}`,
  id
}
