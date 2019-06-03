const path = require('path')
const shell = require('shelljs')
const { contractsPath } = require('./constants.json')

const envsDir = path.join(__dirname, 'envs')
const deployContractsDir = path.join(__dirname, contractsPath, 'deploy')
const erc20ScriptDir = path.join(__dirname, 'scripts')

// native-erc20
shell.cp(path.join(envsDir, 'contracts-deploy.env'), path.join(deployContractsDir, '.env'))
shell.cd(deployContractsDir)
shell.exec('node deploy.js')

// erc20-erc20
shell.cd(erc20ScriptDir)
shell.exec('node deployERC20.js')
shell.cd(deployContractsDir)
shell.rm('.env')
shell.cp(path.join(envsDir, 'erc-contracts-deploy.env'), path.join(deployContractsDir, '.env'))
shell.exec('node deploy.js')
shell.rm('.env')

// erc20-native
shell.cp(
  path.join(envsDir, 'erc-native-contracts-deploy.env'),
  path.join(deployContractsDir, '.env')
)
shell.exec('node src/utils/deployBlockReward.js')
shell.exec('node deploy.js')

// amb
shell.rm('.env')
shell.cp(path.join(envsDir, 'amb-contract-deploy.env'), path.join(deployContractsDir, '.env'))
shell.exec('node deploy.js')
shell.exec('node src/utils/deployTestBox.js')
