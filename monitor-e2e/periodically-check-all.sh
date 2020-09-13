while true; do
  sleep 5
  docker-compose -f ../e2e-commons/docker-compose.yml exec -d monitor yarn check-all
  docker-compose -f ../e2e-commons/docker-compose.yml exec -d monitor-erc20 yarn check-all
  docker-compose -f ../e2e-commons/docker-compose.yml exec -d monitor-erc20-native yarn check-all
  docker-compose -f ../e2e-commons/docker-compose.yml exec -d monitor-amb yarn check-all
done
