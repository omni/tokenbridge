#!/usr/bin/env bash
cd $(dirname $0)

if [ $CI ]; then exit $rc; fi

ps | grep node | grep -v grep | awk '{print "kill " $1}' | /bin/bash
docker-compose down
docker network rm ultimate || true
