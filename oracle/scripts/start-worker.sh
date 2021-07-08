#!/usr/bin/env bash

set -o pipefail

WORKERS_DIR="src/"
LOGS_DIR="logs/"

WORKER="${WORKERS_DIR}${1}.js"
CONFIG="${2}.config.js"
LOG="${LOGS_DIR}${2}.txt"
TX_HASH=${@:3}

if [ "${NODE_ENV}" = "production" ]; then
  exec node "${WORKER}" "${CONFIG}" $TX_HASH
else
  node "${WORKER}" "${CONFIG}" $TX_HASH | tee -a "${LOG}" | pino-pretty
fi
