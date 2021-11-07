#!/usr/bin/env bash
cd $(dirname $0)

if [ $CI ]; then
  rm -rf logs || true

  mkdir ./logs

  for project in "" validator{1,2,3}; do
    for container in $(docker-compose -p "$project" ps | tail -n +3 | awk '{print $1}') ; do
      if [[ -z "$project" ]]; then
        path="./logs/$container.log"
      else
        mkdir -p "./logs/$project"
        path="./logs/$project/$container.log"
      fi
      docker logs "$container" > "$path" 2>&1
    done
  done

  touch ../oracle/.env
  for file in ../oracle/docker-compose-{amb,transfer}.yml; do
    for container in $(docker-compose -f "$file" ps | tail -n +3 | awk '{print $1}') ; do
      mkdir -p "./logs/oracle"
      docker logs "$container" > "./logs/oracle/$container.log" 2>&1
    done
  done

  exit $rc;
fi

ps | grep node | grep -v grep | grep -v yarn | awk '{print "kill " $1}' | /bin/bash
docker-compose down
docker-compose -p validator1 down
docker-compose -p validator2 down
docker-compose -p validator3 down
docker network rm ultimate || true
