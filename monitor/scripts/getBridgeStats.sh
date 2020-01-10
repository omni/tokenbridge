#!/bin/bash
cd $(dirname $0)/..

if /usr/local/bin/docker-compose ps | grep -q -i 'monitor'; then
  for file in configs/*.env
  do
    docker run --rm --env-file $file -v $(pwd)/responses:/mono/monitor/responses monitor_monitor /bin/bash -c 'yarn check-all'
  done
else
  echo "Monitor is not running, skipping checks."
fi
