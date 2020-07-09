#!/usr/bin/env bash
cd $(dirname $0)
set -e # exit when any command fails

docker-compose build parity1 parity2 blocks e2e

while [ "$1" != "" ]; do
  if [ "$1" == "oracle" ]; then
    docker-compose build oracle oracle-erc20 oracle-erc20-native oracle-amb
  elif [ "$1" == "monitor" ]; then
    docker-compose build monitor monitor-erc20 monitor-erc20-native monitor-amb
  elif [ "$1" == "ui" ]; then
    docker-compose build ui ui-erc20 ui-erc20-native ui-amb-stake-erc20-erc20
  fi
  shift
done
