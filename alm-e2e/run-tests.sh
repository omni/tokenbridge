#!/usr/bin/env bash
cd $(dirname $0)

../e2e-commons/up.sh deploy blocks alm alm-e2e

# run oracle amb e2e tests to generate transactions for alm
docker-compose -f ../e2e-commons/docker-compose.yml run e2e yarn workspace oracle-e2e run alm

yarn test
rc=$?

../e2e-commons/down.sh
exit $rc
