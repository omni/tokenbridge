cd $(dirname $0)

docker-compose down
docker-compose up -d --build --force-recreate

docker-compose run e2e yarn workspace oracle-e2e run deploy
docker-compose run -d bridge yarn watcher:signature-request
docker-compose run -d bridge yarn watcher:collected-signatures
docker-compose run -d bridge yarn watcher:affirmation-request
docker-compose run -d bridge-erc yarn watcher:signature-request
docker-compose run -d bridge-erc yarn watcher:collected-signatures
docker-compose run -d bridge-erc yarn watcher:affirmation-request
docker-compose run -d bridge-erc-native yarn watcher:signature-request
docker-compose run -d bridge-erc-native yarn watcher:collected-signatures
docker-compose run -d bridge-erc-native yarn watcher:affirmation-request
docker-compose run -d bridge yarn sender:home
docker-compose run -d bridge yarn sender:foreign
docker-compose run e2e yarn workspace oracle-e2e run start

rc=$?
docker-compose down
exit $rc
