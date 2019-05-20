#!/usr/bin/env bash
cd $(dirname $0)
docker-compose up -d --build --force-recreate
node ./scripts/blocks.js &

docker-compose run contracts ./deploy.sh
docker-compose run -d bridge npm run watcher:signature-request
docker-compose run -d bridge npm run watcher:collected-signatures
docker-compose run -d bridge npm run watcher:affirmation-request
docker-compose run -d bridge-erc20 npm run watcher:signature-request
docker-compose run -d bridge-erc20 npm run watcher:collected-signatures
docker-compose run -d bridge-erc20 npm run watcher:affirmation-request
docker-compose run -d bridge-erc20-native npm run watcher:signature-request
docker-compose run -d bridge-erc20-native npm run watcher:collected-signatures
docker-compose run -d bridge-erc20-native npm run watcher:affirmation-request
docker-compose run -d bridge npm run sender:home
docker-compose run -d bridge npm run sender:foreign
docker-compose run -d -p 3000:3000 ui npm start
docker-compose run -d -p 3001:3000 ui-erc20 npm start
docker-compose run -d -p 3002:3000 ui-erc20-native npm start

yarn mocha -b ./test.js
rc=$?

if [ $CI ]
then
  exit $rc
fi

ps | grep node | grep -v grep | awk '{print "kill " $1}' | sh
docker-compose down
exit $rc
