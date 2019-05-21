const path = require('path')
const shell = require('shelljs')

const envsDir = path.join(__dirname, '../envs')
const deployContractsDir = path.join(__dirname, '../../contracts-2.1.0/deploy')

shell.cp(path.join(envsDir, 'contracts.env'), path.join(deployContractsDir, '.env'))
shell.cd(deployContractsDir)
shell.exec('node deploy.js')
shell.exec('node deployERC20.js')
shell.cd(deployContractsDir)
shell.rm('.env')
shell.cp(path.join(envsDir, 'erc-contracts.env'), path.join(deployContractsDir, '.env'))
shell.exec('node deploy.js')
shell.rm('.env')
shell.cp(
  path.join(envsDir, 'erc-native-contracts.env'),
  path.join(deployContractsDir, '.env')
)
shell.exec('node src/utils/deployBlockReward.js')
shell.exec('node deploy.js')
