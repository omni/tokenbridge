#!/usr/bin/env bash
cd $(dirname $0)
set -e # exit when any command fails

./down.sh
docker-compose build
docker-compose up -d parity1 parity2 redis rabbit e2e

while [ "$1" != "" ]; do
  if [ "$1" == "oracle" ]; then
    docker-compose up -d oracle oracle-erc20 oracle-erc20-native

    docker-compose run -d oracle yarn watcher:signature-request
    docker-compose run -d oracle yarn watcher:collected-signatures
    docker-compose run -d oracle yarn watcher:affirmation-request
    docker-compose run -d oracle-erc20 yarn watcher:signature-request
    docker-compose run -d oracle-erc20 yarn watcher:collected-signatures
    docker-compose run -d oracle-erc20 yarn watcher:affirmation-request
    docker-compose run -d oracle-erc20-native yarn watcher:signature-request
    docker-compose run -d oracle-erc20-native yarn watcher:collected-signatures
    docker-compose run -d oracle-erc20-native yarn watcher:affirmation-request
    docker-compose run -d oracle yarn sender:home
    docker-compose run -d oracle yarn sender:foreign
  fi

  if [ "$1" == "ui" ]; then
    docker-compose up -d ui ui-erc20 ui-erc20-native

    docker-compose run -d -p 3000:3000 ui yarn workspace ui run start
    docker-compose run -d -p 3001:3000 ui-erc20 yarn workspace ui run start
    docker-compose run -d -p 3002:3000 ui-erc20-native yarn workspace ui run start
  fi

  if [ "$1" == "deploy" ]; then
    docker-compose run e2e e2e-commons/scripts/deploy.sh
  fi

  if [ "$1" == "blocks" ]; then
    node ./scripts/blocks.js &
  fi

  shift # Shift all the parameters down by one
done
