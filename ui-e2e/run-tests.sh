#!/usr/bin/env bash

cd $(dirname $0)

../e2e-commons/up.sh deploy oracle ui blocks

yarn mocha -b ./test.js
rc=$?

../e2e-commons/down.sh
exit $rc
