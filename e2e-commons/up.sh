#!/usr/bin/env bash
cd $(dirname $0)
set -e # exit when any command fails

./down.sh
docker-compose build parity1 parity2

if [ -z "$CI" ]; then
  ./build.sh $@
else
  ./pull.sh $@
fi

docker network create --driver bridge ultimate || true
docker-compose up -d parity1 parity2 e2e

startValidator () {
    db_env="-e ORACLE_QUEUE_URL=amqp://$3 -e ORACLE_REDIS_URL=redis://$2"

    docker-compose $1 run -d --name $2 redis
    docker-compose $1 run -d --name $3 rabbit

    if [[ -z "$MODE" || "$MODE" == erc-to-native ]]; then
      docker-compose $1 run $oraclePK $db_env -d oracle-erc20-native yarn watcher:signature-request
      docker-compose $1 run $oracleAddr $db_env -d oracle-erc20-native yarn watcher:collected-signatures
      docker-compose $1 run $oracleAddr $db_env -d oracle-erc20-native yarn watcher:affirmation-request
      docker-compose $1 run $oracleAddr $db_env -d oracle-erc20-native yarn watcher:transfer
    fi
    if [[ -z "$MODE" || "$MODE" == amb ]]; then
      docker-compose $1 run $oraclePK $db_env -d oracle-amb yarn watcher:signature-request
      docker-compose $1 run $oracleAddr $db_env -d oracle-amb yarn watcher:collected-signatures
      docker-compose $1 run $oracleAddr $db_env -d oracle-amb yarn watcher:affirmation-request
      docker-compose $1 run $oracleAddr $db_env -d oracle-amb yarn watcher:information-request
    fi

    docker-compose $1 run $oraclePK $db_env -d oracle-amb yarn sender:home
    docker-compose $1 run $oraclePK $db_env -d oracle-amb yarn sender:foreign
    docker-compose $1 run $oracleAddr $db_env -d oracle-amb yarn manager:shutdown
}

while [ "$1" != "" ]; do
  if [ "$1" == "oracle" ]; then
    oracleAddr="-e ORACLE_VALIDATOR_ADDRESS=0xaaB52d66283F7A1D5978bcFcB55721ACB467384b"
    oraclePK="-e ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY=8e829f695aed89a154550f30262f1529582cc49dc30eff74a6b491359e0230f9"
    startValidator "-p validator1" redis rabbit
  fi

  if [ "$1" == "oracle-validator-2" ]; then
    oracleAddr="-e ORACLE_VALIDATOR_ADDRESS=0xdCC784657C78054aa61FbcFFd2605F32374816A4"
    oraclePK="-e ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY=5a5c3645d0f04e9eb4f27f94ed4c244a225587405b8838e7456f7781ce3a9513"
    startValidator "-p validator2" redis2 rabbit2
  fi

  if [ "$1" == "oracle-validator-3" ]; then
    oracleAddr="-e ORACLE_VALIDATOR_ADDRESS=0xDcef88209a20D52165230104B245803C3269454d"
    oraclePK="-e ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY=f877f62a1c19f852cff1d29f0fb1ecac18821c0080d4cc0520c60c098293dca1"
    startValidator "-p validator3" redis3 rabbit3
  fi

  if [ "$1" == "alm" ]; then
    docker-compose up -d alm

    docker-compose run -d -p 3004:3000 alm serve -p 3000 -s .
  fi

  if [ "$1" == "deploy" ]; then
    docker-compose run e2e e2e-commons/scripts/deploy.sh
  fi

  if [ "$1" == "blocks" ]; then
    docker-compose up -d blocks
  fi

  if [ "$1" == "monitor" ]; then
    case "$MODE" in
      amb)
        docker-compose up -d monitor-amb
        ;;
      erc-to-native)
        docker-compose up -d monitor-erc20-native
        ;;
      *)
        docker-compose up -d monitor-erc20-native monitor-amb
        ;;
    esac
  fi

  if [ "$1" == "alm-e2e" ]; then
    MODE=amb

    oracleAddr="-e ORACLE_VALIDATOR_ADDRESS=0xaaB52d66283F7A1D5978bcFcB55721ACB467384b"
    oraclePK="-e ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY=8e829f695aed89a154550f30262f1529582cc49dc30eff74a6b491359e0230f9"
    startValidator "-p validator1" redis rabbit

    oracleAddr="-e ORACLE_VALIDATOR_ADDRESS=0xdCC784657C78054aa61FbcFFd2605F32374816A4"
    oraclePK="-e ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY=5a5c3645d0f04e9eb4f27f94ed4c244a225587405b8838e7456f7781ce3a9513"
    startValidator "-p validator2" redis2 rabbit2

    oracleAddr="-e ORACLE_VALIDATOR_ADDRESS=0xDcef88209a20D52165230104B245803C3269454d"
    oraclePK="-e ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY=f877f62a1c19f852cff1d29f0fb1ecac18821c0080d4cc0520c60c098293dca1"
    startValidator "-p validator3" redis3 rabbit3
  fi

  if [ "$1" == "generate-amb-tx" ]; then
    docker-compose run e2e yarn workspace oracle-e2e run generate-amb-tx
  fi

  if [ "$1" == "manual-amb-relay" ]; then
    oraclePK="-e ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY=8e829f695aed89a154550f30262f1529582cc49dc30eff74a6b491359e0230f9"
    env="-e COMMON_HOME_BRIDGE_ADDRESS=0x5A42E119990c3F3A80Fea20aAF4c3Ff4DB240Cc9 -e COMMON_FOREIGN_BRIDGE_ADDRESS=0x897527391ad3837604973d78D3514f44c36AB9FC"
    # these tx hash are hardcoded and need to be updated manually
    # once e2e environment setup process is changed
    echo '0xea625a823bc5018dc3a4efe349f623e5ebb8c987b55f44d50d6556f42af9a400' > txHashes.txt
    docker-compose -p validator1 run -v $(pwd)/txHashes.txt:/tmp/txHashes.txt $oraclePK $env oracle-amb yarn confirm:affirmation-request \
      /tmp/txHashes.txt \
      0x031c42e44485002c9215a5b1b75e9516131485ce29884a58765bf7a0038538f9
    docker-compose -p validator1 run $oraclePK $env oracle-amb yarn confirm:signature-request \
      0x1506a18af91afe732167ccbc178b55fc2547da4a814d13c015b6f496cf171754 | tee .tmp.log
    tx_hash=$(cat .tmp.log | grep generatedTransactionHash | jq -r .generatedTransactionHash)
    rm .tmp.log
    rm txHashes.txt
    docker-compose -p validator1 run $oraclePK $env oracle-amb yarn confirm:collected-signatures $tx_hash
  fi

  shift # Shift all the parameters down by one
done
