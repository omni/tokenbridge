#!/usr/bin/env bash
cd $(dirname $0)
set -e # exit when any command fails

docker-compose pull e2e
while [ "$1" != "" ]; do
  if [ "$1" == "oracle" ]; then
    docker-compose pull oracle
  elif [ "$1" == "monitor" ]; then
    docker-compose pull monitor
  elif [ "$1" == "ui" ]; then
    docker-compose pull ui
  fi
  shift
done
