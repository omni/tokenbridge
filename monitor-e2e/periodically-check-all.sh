while true; do
  sleep 3
  docker-compose -f ../e2e-commons/docker-compose.yml exec monitor yarn check-all
  docker-compose -f ../e2e-commons/docker-compose.yml exec monitor-erc20 yarn check-all
  docker-compose -f ../e2e-commons/docker-compose.yml exec monitor-erc20-native yarn check-all
done
