cd $(dirname $0)

../e2e-commons/up.sh monitor deploy

docker-compose -f ../e2e-commons/docker-compose.yml run e2e yarn workspace monitor-e2e run start
rc=$?

../e2e-commons/down.sh
exit $rc
