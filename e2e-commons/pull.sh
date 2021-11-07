#!/usr/bin/env bash
cd $(dirname $0)
set -e # exit when any command fails

docker-compose pull e2e
while [ "$1" != "" ]; do
  if [ "$1" == "oracle" ]; then
    docker-compose pull oracle-amb
  elif [ "$1" == "alm-e2e" ]; then
    docker-compose pull oracle-amb
  elif [ "$1" == "monitor" ]; then
    docker-compose pull monitor-amb
  elif [ "$1" == "alm" ]; then
    docker-compose pull alm
  fi
  shift
done
