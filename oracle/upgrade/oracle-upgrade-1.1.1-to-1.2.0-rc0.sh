#!/bin/bash
  
orig_service="/etc/init.d/poabridge"
new_service=${orig_service}

dockercompose_file="docker-compose-erc-native.yml"
ref_dockercompose_file="docker-compose.yml"

source_dockerimage="poanetwork/tokenbridge-oracle:1.2.0-rc0"

old_oracle_services="bridge_affirmation bridge_collected bridge_request bridge_senderforeign bridge_senderhome bridge_transfer"
new_oracle_services="bridge_affirmation bridge_collected bridge_half_duplex_transfer bridge_request bridge_senderforeign bridge_senderhome bridge_swap_tokens_worker bridge_transfer"

echo "Looking for the service file"
if [ ! -f ${orig_service} ]; then
  echo "Service file ${orig_service} not found"
  exit 1
fi

echo
echo "Indentifying the directory with docker-compose files"
oracle_dir=`cat ${orig_service} | grep 'WORKDIR=' | sed 's/WORKDIR="//' | tr -d '"'`
if [ -z "${oracle_dir}" ]; then
  echo "Cannot identify the directory"
  exit 1
fi

echo
echo "Updating the service file"
if [ ! -f ${new_service}".bak" ]; then
  cp --preserve=all -f ${new_service} ${new_service}".bak"
fi

if [ ! "${orig_service}" == "${new_service}" ]; then
  cp --preserve=all ${orig_service} ${new_service}
fi
sed -i 's/-f docker-compose-transfer.yml/-f docker-compose-erc-native.yml/' ${new_service}
sed -i 's/rebuild)/isnotsupported)/' ${new_service}
if [ -z "`grep 'f docker-compose-erc-native.yml' ${new_service}`" ]; then
  echo "The service file was not updated properly"
  exit 1
fi

echo
echo "Re-enable service file"
systemctl daemon-reload
if [ ! "$?" == "0" ]; then
  echo "An error during the service file reload"
  exit 1
fi

echo
echo "Generate a new docker-compose file"
cat <<tEOF > ${oracle_dir}/${dockercompose_file}
networks:
  net_db_bridge_affirmation: {driver: bridge}
  net_db_bridge_collected: {driver: bridge}
  net_db_bridge_half_duplex_transfer: {driver: bridge}
  net_db_bridge_request: {driver: bridge}
  net_db_bridge_senderforeign: {driver: bridge}
  net_db_bridge_senderhome: {driver: bridge}
  net_db_bridge_transfer: {driver: bridge}
  net_rabbit_bridge_affirmation: {driver: bridge}
  net_rabbit_bridge_collected: {driver: bridge}
  net_rabbit_bridge_half_duplex_transfer: {driver: bridge}
  net_rabbit_bridge_request: {driver: bridge}
  net_rabbit_bridge_senderforeign: {driver: bridge}
  net_rabbit_bridge_senderhome: {driver: bridge}
  net_rabbit_bridge_swap_tokens_worker: {driver: bridge}
  net_rabbit_bridge_transfer: {driver: bridge}
services:
  bridge_affirmation:
    extends: {file: docker-compose.yml, service: bridge_affirmation}
    logging:
      driver: syslog
      options: {tag: '{{.Name}}/{{.ID}}'}
    networks: [net_db_bridge_request, net_rabbit_bridge_request]
    depends_on:
      - redis
      - rabbit  
  bridge_collected:
    extends: {file: docker-compose.yml, service: bridge_collected}
    logging:
      driver: syslog
      options: {tag: '{{.Name}}/{{.ID}}'}
    networks: [net_db_bridge_request, net_rabbit_bridge_request]
    depends_on:
      - redis
      - rabbit
  bridge_half_duplex_transfer:
    build: {context: .., dockerfile: oracle/Dockerfile}
    cpus: 0.1
    entrypoint: yarn watcher:half-duplex-transfer
    env_file: ./.env
    environment: [NODE_ENV=production, 'ORACLE_VALIDATOR_ADDRESS=\${ORACLE_VALIDATOR_ADDRESS}']
    logging:
      driver: syslog
      options: {tag: '{{.Name}}/{{.ID}}'}
    mem_limit: 500m
    networks: [net_db_bridge_half_duplex_transfer, net_rabbit_bridge_half_duplex_transfer]
    restart: unless-stopped
    depends_on:
      - redis
      - rabbit
  bridge_request:
    extends: {file: docker-compose.yml, service: bridge_request}
    logging:
      driver: syslog
      options: {tag: '{{.Name}}/{{.ID}}'}
    networks: [net_db_bridge_request, net_rabbit_bridge_request]
    depends_on:
      - redis
      - rabbit
  bridge_senderforeign:
    extends: {file: docker-compose.yml, service: bridge_senderforeign}
    logging:
      driver: syslog
      options: {tag: '{{.Name}}/{{.ID}}'}
    networks: [net_db_bridge_request, net_rabbit_bridge_request]
    depends_on:
      - redis
      - rabbit
  bridge_senderhome:
    extends: {file: docker-compose.yml, service: bridge_senderhome}
    logging:
      driver: syslog
      options: {tag: '{{.Name}}/{{.ID}}'}
    networks: [net_db_bridge_request, net_rabbit_bridge_request]
    depends_on:
      - redis
      - rabbit
  bridge_swap_tokens_worker:
    build: {context: .., dockerfile: oracle/Dockerfile}
    cpus: 0.1
    entrypoint: yarn worker:swap-tokens
    env_file: ./.env
    environment: [NODE_ENV=production, 'ORACLE_VALIDATOR_ADDRESS=\${ORACLE_VALIDATOR_ADDRESS}']
    logging:
      driver: syslog
      options: {tag: '{{.Name}}/{{.ID}}'}
    mem_limit: 500m
    networks: [net_rabbit_bridge_swap_tokens_worker]
    restart: unless-stopped
    depends_on:
      - rabbit
  bridge_transfer:
    build: {context: .., dockerfile: oracle/Dockerfile}
    cpus: 0.1
    entrypoint: yarn watcher:transfer
    env_file: ./.env
    environment: [NODE_ENV=production, 'ORACLE_VALIDATOR_ADDRESS=\${ORACLE_VALIDATOR_ADDRESS}']
    logging:
      driver: syslog
      options: {tag: '{{.Name}}/{{.ID}}'}
    mem_limit: 500m
    networks: [net_db_bridge_transfer, net_rabbit_bridge_transfer]
    restart: unless-stopped
    depends_on:
      - redis
      - rabbit
  rabbit:
    extends: {file: docker-compose.yml, service: rabbit}
    logging:
      driver: syslog
      options: {tag: '{{.Name}}/{{.ID}}'}
    networks: [net_rabbit_bridge_transfer, net_rabbit_bridge_swap_tokens_worker, net_rabbit_bridge_half_duplex_transfer]
  redis:
    extends: {file: docker-compose.yml, service: redis}
    logging:
      driver: syslog
      options: {tag: '{{.Name}}/{{.ID}}'}
    networks: [net_db_bridge_transfer, net_db_bridge_half_duplex_transfer]
version: '2.4'
tEOF

if [ ! -f ${oracle_dir}/${dockercompose_file} ]; then
  echo "New compose file was not generated"
  exit 1
fi

chmod --reference=${oracle_dir}/${ref_dockercompose_file} ${oracle_dir}/${dockercompose_file}
chown --reference=${oracle_dir}/${ref_dockercompose_file} ${oracle_dir}/${dockercompose_file}

echo
echo "Delete previous docker images"
for i in ${old_oracle_services}; do
  docker rmi "oracle_"${i}
done

echo
echo "Pull the docker image for 1.2.0-rc0"
docker pull ${source_dockerimage}

docker inspect ${source_dockerimage} >/dev/null
if [ ! "$?" == "0" ]; then
  echo "An error with pulling of the docker image"
  exit 1
fi

echo
echo "Create new set of docker images"
for i in ${new_oracle_services}; do
  docker tag ${source_dockerimage} "oracle_"${i}
done
