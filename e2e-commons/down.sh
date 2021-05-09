#!/usr/bin/env bash
cd $(dirname $0)

if [ $CI ]; then exit $rc; fi

ps | grep node | grep -v grep | grep -v yarn | awk '{print "kill " $1}' | /bin/bash
docker-compose down
docker-compose -p validator1 down
docker-compose -p validator2 down
docker-compose -p validator3 down
docker network rm ultimate || true
