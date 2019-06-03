#!/usr/bin/env bash
cd $(dirname $0)

../e2e-commons/up.sh oracle ui deploy blocks

yarn mocha -b ./test.js
rc=$?
if [ $CI ]; then exit $rc; fi

../e2e-commons/down.sh
exit $rc
