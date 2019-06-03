#!/usr/bin/env bash
cd $(dirname $0)
set -e # exit when any command fails

CONTRACTS_PATH="../../contracts"
DEPLOY_PATH="$CONTRACTS_PATH/deploy"
ENVS_PATH="../envs"

# shell.cp(path.join(envsDir, 'contracts.env'), path.join(deployContractsDir, '.env'))
cp "$ENVS_PATH/native-to-erc.env" "$DEPLOY_PATH/.env"

# shell.cd(deployContractsDir)
cd "$DEPLOY_PATH"

# shell.exec('node deploy.js')
echo -e "\n############ Deploying native-to-erc ############"
node deploy.js

# shell.cd(__dirname)
cd - > /dev/null

# shell.exec('node deployERC20.js')
echo -e "\n############ Deploying erc20 ############"
node deployERC20.js

# shell.cd(deployContractsDir)
cd "$DEPLOY_PATH"

# shell.rm('.env')
rm .env

# shell.cp(path.join(envsDir, 'erc-contracts.env'), path.join(deployContractsDir, '.env'))
cd - > /dev/null
cp "$ENVS_PATH/erc-to-erc.env" "$DEPLOY_PATH/.env"
cd "$DEPLOY_PATH"

# shell.exec('node deploy.js')
echo -e "\n############ Deploying erc-to-erc ############"
node deploy.js

# shell.rm('.env')
rm .env

cd - > /dev/null
# shell.cp(
#   path.join(envsDir, 'erc-native-contracts.env'),
#   path.join(deployContractsDir, '.env')
# )
cp "$ENVS_PATH/erc-to-native.env" "$DEPLOY_PATH/.env"
cd "$DEPLOY_PATH"

echo -e "\n############ Deploying block reward ############"
node src/utils/deployBlockReward.js
echo -e "\n############ Deploying erc-to-native ############"
node deploy.js
