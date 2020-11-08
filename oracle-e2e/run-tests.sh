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

MODE="$mode" ../e2e-commons/up.sh deploy blocks oracle oracle-validator-2 oracle-validator-3

docker-compose -f ../e2e-commons/docker-compose.yml run e2e yarn workspace oracle-e2e run start $script
rc=$?

../e2e-commons/down.sh
exit $rc
