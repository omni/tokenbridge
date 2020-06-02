const { override, disableEsLint } = require('customize-cra')
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')

const disableModuleScopePlugin = () => config => {
  config.resolve.plugins = config.resolve.plugins.filter(plugin => !(plugin instanceof ModuleScopePlugin))
  return config
}

module.exports = override(disableEsLint(), disableModuleScopePlugin())
