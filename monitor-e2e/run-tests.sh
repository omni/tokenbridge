#!/usr/bin/env bash
cd $(dirname $0)
set -e # exit when any command fails


##### Helper Functions #####

function cleanup {
  ../e2e-commons/down.sh
}
trap cleanup EXIT

FILES=(getBalances.json validators.json eventsStats.json alerts.json)

check_files_exist() {
  rc=0
  for f in "${FILES[@]}"; do
    command="test -f responses/$f"
    (docker-compose -f ../e2e-commons/docker-compose.yml exec monitor /bin/bash -c "$command") || rc=1
    (docker-compose -f ../e2e-commons/docker-compose.yml exec monitor-erc20 /bin/bash -c "$command") || rc=1
    (docker-compose -f ../e2e-commons/docker-compose.yml exec monitor-erc20-native /bin/bash -c "$command") || rc=1
  done
  return $rc
}


##### Initialization #####

../e2e-commons/up.sh deploy oracle monitor


##### Initial checks #####

docker-compose -f ../e2e-commons/docker-compose.yml exec monitor /bin/bash -c "yarn check-all"
docker-compose -f ../e2e-commons/docker-compose.yml exec monitor-erc20 /bin/bash -c "yarn check-all"
docker-compose -f ../e2e-commons/docker-compose.yml exec monitor-erc20-native /bin/bash -c "yarn check-all"
check_files_exist


##### Test cases #####

./native-to-erc.sh

./erc-to-erc.sh

./erc-to-native.sh


##### Cleanup #####

cleanup
