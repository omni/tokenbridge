const baseConfig = require('./base.config')
const { ERC_TYPES } = require('../../commons')

const initialChecksJson = process.argv[3]

if (!initialChecksJson) {
  throw new Error('initial check parameter was not provided.')
}

let initialChecks
try {
  initialChecks = JSON.parse(initialChecksJson)
} catch (e) {
  throw new Error('Error on decoding values from initial checks.')
}

if (baseConfig.id === 'erc-erc' && initialChecks.foreignERC === ERC_TYPES.ERC677) {
  baseConfig.id = 'erc677-erc677'
}

const id = `${baseConfig.id}-affirmation-request`

module.exports = {
  ...baseConfig.bridgeConfig,
  ...baseConfig.foreignConfig,
  event: 'UserRequestForAffirmation',
  queue: 'home-prioritized',
  name: `watcher-${id}`,
  id
}
