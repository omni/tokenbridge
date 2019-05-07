const baseConfig = require('./base.config')

const id = `${baseConfig.id}-signature-request`

module.exports = {
  ...baseConfig.bridgeConfig,
  ...baseConfig.homeConfig,
  event: 'UserRequestForSignature',
  queue: 'home',
  name: `watcher-${id}`,
  id
}
