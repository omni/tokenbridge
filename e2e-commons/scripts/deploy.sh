#!/usr/bin/env bash
cd $(dirname $0)
set -e # exit when any command fails

CONTRACTS_PATH="../../contracts"
DEPLOY_PATH="$CONTRACTS_PATH/deploy"
ENVS_PATH="../contracts-envs"

# mock bridge validators contract with the one with deterministic isValidatorDuty
mv "$CONTRACTS_PATH/build/contracts/BridgeValidatorsDeterministic.json" "$CONTRACTS_PATH/build/contracts/BridgeValidators.json"

echo -e "\n\n############ Deploying native-to-erc ############\n"
cp "$ENVS_PATH/native-to-erc.env" "$DEPLOY_PATH/.env"
cd "$DEPLOY_PATH"
node deploy.js
cd - > /dev/null

echo -e "\n\n############ Deploying erc20 and erc-to-erc ############\n"
node deployERC20.js
cp "$ENVS_PATH/erc-to-erc.env" "$DEPLOY_PATH/.env"
cd "$DEPLOY_PATH"
node deploy.js
cd - > /dev/null

echo -e "\n\n############ Deploying block reward ############\n"
cd "$DEPLOY_PATH"
node src/utils/deployBlockReward.js
cd - > /dev/null

echo -e "\n\n############ Deploying erc-to-native ############\n"
cp "$ENVS_PATH/erc-to-native.env" "$DEPLOY_PATH/.env"
cd "$DEPLOY_PATH"
node deploy.js
cd - > /dev/null

echo -e "\n\n############ Deploying amb ############\n"
cp "$ENVS_PATH/amb.env" "$DEPLOY_PATH/.env"
cd "$DEPLOY_PATH"
node deploy.js
cd - > /dev/null

echo -e "\n\n############ Deploying test contract for amb ############\n"
cd "$DEPLOY_PATH"
node src/utils/deployTestBox.js
cd - > /dev/null

echo -e "\n\n############ Deploying amb stake erc to erc ############\n"
cp "$ENVS_PATH/amb-stake-erc-to-erc.env" "$DEPLOY_PATH/.env"
node deployMultiBridgeToken.js
node deployBridgeTokenRewardable.js
cd "$DEPLOY_PATH"
node deploy.js
cd - > /dev/null
node setupStakeTokens.js
cd - > /dev/null

echo -e "\n\n############ Deploying one more test contract for amb ############\n"
cd "$DEPLOY_PATH"
node src/utils/deployTestBox.js
cd - > /dev/null
