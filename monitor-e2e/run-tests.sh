#!/usr/bin/env bash
cd $(dirname $0)

../e2e-commons/up.sh oracle deploy monitor

FILES=(getBalances.json validators.json eventsStats.json alerts.json)

check_files_exist() {
  rc=0
  for f in "${FILES[@]}"; do
    command="test -f responses/$f"
    (docker-compose -f ../e2e-commons/docker-compose.yml exec monitor /bin/bash -c "$command") || rc=1
  done
  return $rc
}

! check_files_exist
rc1=$?

docker-compose -f ../e2e-commons/docker-compose.yml exec monitor /bin/bash -c "node checkWorker.js"
docker-compose -f ../e2e-commons/docker-compose.yml exec monitor /bin/bash -c "node checkWorker2.js"

check_files_exist
rc2=$?

../e2e-commons/down.sh
[[ $rc1 -eq 0 && $rc2 -eq 0 ]] || exit 1
