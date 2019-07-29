#!/usr/bin/env bash
cd $(dirname $0)
set -e # exit when any command fails

echo "MONITOR E2E - NATIVE TO ERC"

echo "Test case - Web Interface should return balances"
OUTPUT=$(curl -s http://localhost:3003/)
grep -q home <<< "$OUTPUT"
grep -q foreign <<< "$OUTPUT"
(! grep -q error <<< "$OUTPUT")

echo "Test case - Web Interface should return validators"
OUTPUT=$(curl -s http://localhost:3003/validators)
grep -q home <<< "$OUTPUT"
grep -q foreign <<< "$OUTPUT"
(! grep -q error <<< "$OUTPUT")

echo "Test case - Web Interface should return eventsStats"
OUTPUT=$(curl -s http://localhost:3003/eventsStats)
grep -q lastChecked <<< "$OUTPUT"
(! grep -q error <<< "$OUTPUT")

echo "Test case - Web Interface should return alerts"
OUTPUT=$(curl -s http://localhost:3003/alerts)
grep -q lastChecked <<< "$OUTPUT"
(! grep -q error <<< "$OUTPUT")
