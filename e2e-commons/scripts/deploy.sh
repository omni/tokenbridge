#!/usr/bin/env bash
cd $(dirname $0)
set -e # exit when any command fails

CONTRACTS_PATH="../../contracts"
DEPLOY_PATH="$CONTRACTS_PATH/deploy"
ENVS_PATH="../contracts-envs"

# mock bridge validators contract with the one with deterministic isValidatorDuty
mv "$CONTRACTS_PATH/build/contracts/BridgeValidatorsDeterministic.json" "$CONTRACTS_PATH/build/contracts/BridgeValidators.json"

echo -e "\n\n############ Deploying block reward ############\n"
cp "$ENVS_PATH/erc-to-native.env" "$DEPLOY_PATH/.env"
cd "$DEPLOY_PATH"
node src/utils/deployBlockReward.js
cd - > /dev/null

echo -e "\n\n############ Deploying erc-to-native ############\n"
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

echo -e "\n\n############ Deploying one more test contract for amb ############\n"
cd "$DEPLOY_PATH"
node src/utils/deployTestBox.js
cd - > /dev/null

echo -e "\n\n############ Deploying one more amb without oracle for confirm relay tests ############\n"
cp "$ENVS_PATH/amb.env" "$DEPLOY_PATH/.env"
cd "$DEPLOY_PATH"
node deploy.js
cd - > /dev/null
