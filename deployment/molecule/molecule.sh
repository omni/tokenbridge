#!/usr/bin/env bash
cd $(dirname $0)
set -e # exit when any command fails

CODEBASE_BRANCH=${CIRCLE_BRANCH-$(git symbolic-ref --short HEAD)}

while [ "$1" != "" ]; do
  docker-compose build && docker-compose run -e CODEBASE_BRANCH=$CODEBASE_BRANCH molecule_runner /bin/bash -c "molecule test --scenario-name $1"

  shift # Shift all the parameters down by one
done
