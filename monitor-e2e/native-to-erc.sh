set -e # exit when any command fails

echo "MONITOR E2E - NATIVE TO ERC"
export URL="localhost:3010"

echo "Test case - Web Interface should return balances"
OUTPUT=$(curl -s http://$URL/)
grep -q home <<< "$OUTPUT"
grep -q foreign <<< "$OUTPUT"
(! grep -q error <<< "$OUTPUT")

echo "Test case - Web Interface should return validators"
OUTPUT=$(curl -s http://$URL/validators)
grep -q home <<< "$OUTPUT"
grep -q foreign <<< "$OUTPUT"
(! grep -q error <<< "$OUTPUT")

echo "Test case - Web Interface should return eventsStats"
OUTPUT=$(curl -s http://$URL/eventsStats)
grep -q lastChecked <<< "$OUTPUT"
(! grep -q error <<< "$OUTPUT")

echo "Test case - Web Interface should return alerts"
OUTPUT=$(curl -s http://$URL/alerts)
grep -q lastChecked <<< "$OUTPUT"
(! grep -q error <<< "$OUTPUT")
