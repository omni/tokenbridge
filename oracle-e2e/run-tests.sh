cd $(dirname $0)
set -e

../e2e-commons/up.sh oracle deploy

docker-compose -f ../e2e-commons/docker-compose.yml run e2e yarn workspace oracle-e2e run start
rc=$?

../e2e-commons/down.sh
exit $rc
