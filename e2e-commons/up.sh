#!/usr/bin/env bash
cd $(dirname $0)
set -e # exit when any command fails

./down.sh
docker-compose build
docker network create --driver bridge ultimate || true
docker-compose up -d parity1 parity2 e2e

while [ "$1" != "" ]; do
  if [ "$1" == "oracle" ]; then
    docker-compose up -d redis rabbit oracle oracle-erc20 oracle-erc20-native oracle-amb

    docker-compose run -d oracle yarn watcher:signature-request
    docker-compose run -d oracle yarn watcher:collected-signatures
    docker-compose run -d oracle yarn watcher:affirmation-request
    docker-compose run -d oracle-erc20 yarn watcher:signature-request
    docker-compose run -d oracle-erc20 yarn watcher:collected-signatures
    docker-compose run -d oracle-erc20 yarn watcher:affirmation-request
    docker-compose run -d oracle-erc20 yarn watcher:transfer
    docker-compose run -d oracle-erc20-native yarn watcher:signature-request
    docker-compose run -d oracle-erc20-native yarn watcher:collected-signatures
    docker-compose run -d oracle-erc20-native yarn watcher:affirmation-request
    docker-compose run -d oracle-erc20-native yarn watcher:transfer
    docker-compose run -d oracle-erc20-native yarn watcher:half-duplex-transfer
    docker-compose run -d oracle-erc20-native yarn worker:swap-tokens
    docker-compose run -d oracle-amb yarn watcher:signature-request
    docker-compose run -d oracle-amb yarn watcher:collected-signatures
    docker-compose run -d oracle-amb yarn watcher:affirmation-request
    docker-compose run -d oracle yarn sender:home
    docker-compose run -d oracle yarn sender:foreign

    # erc20-native Validator 2
    oracle2name="-p validator2"
    ORACLE_VALIDATOR_ADDRESS=0xdCC784657C78054aa61FbcFFd2605F32374816A4 ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY=5a5c3645d0f04e9eb4f27f94ed4c244a225587405b8838e7456f7781ce3a9513 docker-compose $oracle2name up -d redis rabbit oracle-erc20-native
    docker-compose $oracle2name run -d oracle-erc20-native yarn watcher:signature-request
    docker-compose $oracle2name run -d oracle-erc20-native yarn watcher:collected-signatures
    docker-compose $oracle2name run -d oracle-erc20-native yarn watcher:affirmation-request
    docker-compose $oracle2name run -d oracle-erc20-native yarn watcher:transfer
    docker-compose $oracle2name run -d oracle-erc20-native yarn watcher:half-duplex-transfer
    docker-compose $oracle2name run -d oracle-erc20-native yarn worker:swap-tokens
    docker-compose $oracle2name run -d oracle yarn sender:home
    docker-compose $oracle2name run -d oracle yarn sender:foreign

    # erc20-native Validator 3
    oracle3name="-p validator3"
    ORACLE_VALIDATOR_ADDRESS=0xDcef88209a20D52165230104B245803C3269454d ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY=f877f62a1c19f852cff1d29f0fb1ecac18821c0080d4cc0520c60c098293dca1 docker-compose $oracle3name up -d redis rabbit oracle-erc20-native
    docker-compose $oracle3name run -d oracle-erc20-native yarn watcher:signature-request
    docker-compose $oracle3name run -d oracle-erc20-native yarn watcher:collected-signatures
    docker-compose $oracle3name run -d oracle-erc20-native yarn watcher:affirmation-request
    docker-compose $oracle3name run -d oracle-erc20-native yarn watcher:transfer
    docker-compose $oracle3name run -d oracle-erc20-native yarn watcher:half-duplex-transfer
    docker-compose $oracle3name run -d oracle-erc20-native yarn worker:swap-tokens
    docker-compose $oracle3name run -d oracle yarn sender:home
    docker-compose $oracle3name run -d oracle yarn sender:foreign
  fi

  if [ "$1" == "ui" ]; then
    docker-compose up -d ui ui-erc20 ui-erc20-native

    docker-compose run -d -p 3000:3000 ui yarn start
    docker-compose run -d -p 3001:3000 ui-erc20 yarn start
    docker-compose run -d -p 3002:3000 ui-erc20-native yarn start
  fi

  if [ "$1" == "deploy" ]; then
    docker-compose run e2e e2e-commons/scripts/deploy.sh
  fi

  if [ "$1" == "blocks" ]; then
    node ./scripts/blocks.js &
  fi

  if [ "$1" == "monitor" ]; then
    docker-compose up -d monitor monitor-erc20 monitor-erc20-native monitor-amb
  fi

  if [ "$1" == "native-to-erc" ]; then
    ../deployment-e2e/molecule.sh ultimate-native-to-erc
  fi

  if [ "$1" == "erc-to-native" ]; then
    ../deployment-e2e/molecule.sh ultimate-erc-to-native
  fi

  if [ "$1" == "erc-to-erc" ]; then
    ../deployment-e2e/molecule.sh ultimate-erc-to-erc
  fi

  shift # Shift all the parameters down by one
done
