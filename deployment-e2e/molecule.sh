#!/usr/bin/env bash
cd ./e2e-commons
set -e # exit when any command fails

docker-compose pull molecule_runner
docker network create --driver bridge ultimate || true
while [ "$1" != "" ]; do
  docker-compose run molecule_runner /bin/bash -c "molecule test --scenario-name $1"

  shift # Shift all the parameters down by one
done
