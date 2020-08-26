#!/usr/bin/env bash
cd $(dirname $0)
set -e # exit when any command fails

docker-compose build e2e
while [ "$1" != "" ]; do
  if [ "$1" == "oracle" ]; then
    docker-compose build oracle
  elif [ "$1" == "monitor" ]; then
    docker-compose build monitor
  elif [ "$1" == "ui" ]; then
    docker-compose build ui
  elif [ "$1" == "alm" ]; then
    docker-compose build alm
  fi
  shift
done
