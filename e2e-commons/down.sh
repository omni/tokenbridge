#!/usr/bin/env bash
cd $(dirname $0)

ps | grep node | grep -v grep | awk '{print "kill " $1}' | sh
docker-compose down
