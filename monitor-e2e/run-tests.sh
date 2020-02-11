cd $(dirname $0)

../e2e-commons/up.sh deploy blocks monitor

./wait-for-monitor.sh
nohup ./periodically-check-all.sh < /dev/null > /dev/null 2>&1 &
checkPID=$!

docker-compose -f ../e2e-commons/docker-compose.yml run e2e yarn workspace monitor-e2e run start
rc=$?

../e2e-commons/down.sh
kill $checkPID
exit $rc
