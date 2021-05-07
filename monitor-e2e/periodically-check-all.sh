while true; do
  docker-compose -f ../e2e-commons/docker-compose.yml exec -T monitor-erc20-native yarn check-all
  pid1=$!
  docker-compose -f ../e2e-commons/docker-compose.yml exec -T monitor-amb yarn check-all
  pid2=$!

  wait $pid1
  wait $pid2
done
