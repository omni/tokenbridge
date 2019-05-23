cd $(dirname $0)

ps | grep node | grep -v grep | awk '{print "kill " $1}' | sh
docker-compose down

docker-compose up -d --build

docker-compose run e2e yarn workspace oracle-e2e run deploy

ps | grep node | grep -v grep | awk '{print "kill " $1}' | sh
docker-compose down
exit 0


docker-compose run -d bridge npm run watcher:signature-request
docker-compose run -d bridge npm run watcher:collected-signatures
docker-compose run -d bridge npm run watcher:affirmation-request
docker-compose run -d bridge-erc npm run watcher:signature-request
docker-compose run -d bridge-erc npm run watcher:collected-signatures
docker-compose run -d bridge-erc npm run watcher:affirmation-request
docker-compose run -d bridge-erc-native npm run watcher:signature-request
docker-compose run -d bridge-erc-native npm run watcher:collected-signatures
docker-compose run -d bridge-erc-native npm run watcher:affirmation-request
docker-compose run -d bridge npm run sender:home
docker-compose run -d bridge npm run sender:foreign
docker-compose run e2e yarn workspace oracle-e2e run start

rc=$?
docker-compose down
exit $rc
