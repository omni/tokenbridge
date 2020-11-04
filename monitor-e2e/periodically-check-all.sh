while true; do
  docker-compose -f ../e2e-commons/docker-compose.yml exec -T monitor yarn check-all
  pid1=$!
  docker-compose -f ../e2e-commons/docker-compose.yml exec -T monitor-erc20 yarn check-all
  pid2=$!
  docker-compose -f ../e2e-commons/docker-compose.yml exec -T monitor-erc20-native yarn check-all
  pid3=$!
  docker-compose -f ../e2e-commons/docker-compose.yml exec -T monitor-amb yarn check-all
  pid4=$!

  wait $pid1
  wait $pid2
  wait $pid3
  wait $pid4
done
