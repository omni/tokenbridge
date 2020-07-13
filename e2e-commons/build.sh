#!/usr/bin/env bash
cd $(dirname $0)
set -e # exit when any command fails

docker-compose build parity1 parity2

docker-compose pull e2e
while [ "$1" != "" ]; do
  if [ "$1" == "oracle" ]; then
    docker-compose pull oracle
  elif [ "$1" == "monitor" ]; then
    docker-compose pull monitor
  elif [ "$1" == "ui" ]; then
    docker-compose pull ui
    # this should only rebuild last 3 steps from ui/Dockerfile
    docker-compose build ui ui-erc20 ui-erc20-native ui-amb-stake-erc20-erc20
  fi
  shift
done
