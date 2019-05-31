cd $(dirname $0)

../e2e-commons/up.sh oracle

docker-compose -f ../e2e-commons/docker-compose.yml run e2e yarn workspace oracle-e2e run deploy

docker-compose -f ../e2e-commons/docker-compose.yml run e2e yarn workspace oracle-e2e run start

rc=$?
docker-compose down
exit $rc
