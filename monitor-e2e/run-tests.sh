cd $(dirname $0)

mode="$1"
case "$mode" in
  amb)
    script=./test/amb.js
    ;;
  native-to-erc)
    script=./test/nativeToErc.js
    ;;
  erc-to-erc)
    script=./test/ercToErc.js
    ;;
  erc-to-native)
    script=./test/ercToNative.js
    ;;
esac

MODE="$mode" ../e2e-commons/up.sh deploy blocks monitor

MODE="$mode" ./wait-for-monitor.sh
nohup ./periodically-check-all.sh < /dev/null > /dev/null 2>&1 &
checkPID=$!

docker-compose -f ../e2e-commons/docker-compose.yml run e2e yarn workspace monitor-e2e run start $script
rc=$?

../e2e-commons/down.sh
kill $checkPID
exit $rc
