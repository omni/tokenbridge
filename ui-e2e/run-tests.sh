#!/usr/bin/env bash
cd $(dirname $0)

docker-compose down
docker-compose up -d --build --force-recreate
node ./scripts/blocks.js &

docker-compose run e2e yarn workspace ui-e2e run deploy
docker-compose run -d bridge yarn watcher:signature-request
docker-compose run -d bridge yarn watcher:collected-signatures
docker-compose run -d bridge yarn watcher:affirmation-request
docker-compose run -d bridge-erc20 yarn watcher:signature-request
docker-compose run -d bridge-erc20 yarn watcher:collected-signatures
docker-compose run -d bridge-erc20 yarn watcher:affirmation-request
docker-compose run -d bridge-erc20-native yarn watcher:signature-request
docker-compose run -d bridge-erc20-native yarn watcher:collected-signatures
docker-compose run -d bridge-erc20-native yarn watcher:affirmation-request
docker-compose run -d bridge yarn sender:home
docker-compose run -d bridge yarn sender:foreign
docker-compose run -d -p 3000:3000 ui yarn workspace ui run start
docker-compose run -d -p 3001:3000 ui-erc20 yarn workspace ui run start
docker-compose run -d -p 3002:3000 ui-erc20-native yarn workspace ui run start

yarn mocha -b ./test.js
rc=$?
if [ $CI ]; then exit $rc; fi

ps | grep node | grep -v grep | awk '{print "kill " $1}' | sh
docker-compose down
exit $rc
