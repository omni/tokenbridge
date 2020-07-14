while true; do
  sleep 3
  COMPOSE_INTERACTIVE_NO_CLI=1 nohup docker-compose -f ../e2e-commons/docker-compose.yml exec monitor yarn check-all
  COMPOSE_INTERACTIVE_NO_CLI=1 nohup docker-compose -f ../e2e-commons/docker-compose.yml exec monitor-erc20 yarn check-all
  COMPOSE_INTERACTIVE_NO_CLI=1 nohup docker-compose -f ../e2e-commons/docker-compose.yml exec monitor-erc20-native yarn check-all
  COMPOSE_INTERACTIVE_NO_CLI=1 nohup docker-compose -f ../e2e-commons/docker-compose.yml exec monitor-amb yarn check-all
done
