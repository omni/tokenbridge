#!/usr/bin/env bash

set -o pipefail

WORKERS_DIR="src/"
LOGS_DIR="logs/"

WORKER="${WORKERS_DIR}${1}.js"
CONFIG="${2}.config.js"
LOG="${LOGS_DIR}${2}.txt"

CHECKS=$(node scripts/initialChecks.js)

if [ "${NODE_ENV}" = "production" ]; then
  exec node "${WORKER}" "${CONFIG}" "$CHECKS"
else
  node "${WORKER}" "${CONFIG}" "$CHECKS" | tee -a "${LOG}" | pino-pretty
fi
