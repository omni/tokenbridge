const { addDecoratorsLegacy, disableEsLint, override } = require('customize-cra')
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')

const disableModuleScopePlugin = () => config => {
  config.resolve.plugins = config.resolve.plugins.filter(
    plugin => !(plugin instanceof ModuleScopePlugin)
  )
  return config
}

module.exports = override(addDecoratorsLegacy(), disableEsLint(), disableModuleScopePlugin())
