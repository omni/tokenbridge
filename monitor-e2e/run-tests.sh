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
  done
  return $rc
}


##### Initialization #####

../e2e-commons/up.sh oracle deploy monitor


##### Test cases #####

# Test case - CheckWorker scripts should work and create files in responses/ directory

! check_files_exist

docker-compose -f ../e2e-commons/docker-compose.yml exec monitor /bin/bash -c "node checkWorker.js"
docker-compose -f ../e2e-commons/docker-compose.yml exec monitor /bin/bash -c "node checkWorker2.js"

check_files_exist

# Test case - Web Interface should return balances

#curl

# Test case - Web Interface should return validators

# Test case - Web Interface should return eventsStats

# Test case - Web Interface should return alerts


##### Cleanup #####

cleanup
