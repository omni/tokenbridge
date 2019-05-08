#!/usr/bin/env bash
docker-compose up -d --build --force-recreate
cd ..
npm run start:blocks &
cd e2e-script
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
docker-compose run -d ui npm start
docker-compose run -d ui-erc20 npm start
docker-compose run -d ui-erc20-native npm start
cd ..
npm run startE2e
rc=$?
cd e2e-script
ps | grep node | grep -v grep | awk '{print "kill " $1}' | sh
docker-compose down
exit $rc
