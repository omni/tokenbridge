#!/bin/bash

CONFIGDIR="configs"
RESPONSESDIR="responses"
IMAGETAG="latest"

cd $(dirname $0)/..

if /usr/local/bin/docker-compose ps | grep -q -i 'monitor'; then
  tstart=`date +"%s"`
  
  for file in ${CONFIGDIR}/*.env
  do
    echo "${file} handling..."
    
    bridgename=`source ${file} && echo ${MONITOR_BRIDGE_NAME}`
    reportdir=${RESPONSESDIR}"/"${bridgename}
    if [ ! -d ${reportdir} ]; then
      mkdir -p ${reportdir}
    fi
    for json in alerts.json eventsStats.json getBalances.json validators.json; do
      echo '{"health": false, "lastChecked": '`date +"%s"`'}' > ${reportdir}/${json}
    done
    # this file exists only for some bridges so it will handle it separately
    if [ -f ${reportdir}/stuckTransfers.json ]; then
      echo '{"health": false, "lastChecked": '`date +"%s"`'}' > ${reportdir}/stuckTransfers.json
    fi

    containername=${bridgename}"-checker"
    docker container stats --no-stream ${containername} 2>/dev/null 1>&2
    if [ ! "$?" == "0" ]; then
      docker run --rm --env-file $file -v $(pwd)/${RESPONSESDIR}:/mono/monitor/responses \
        --name ${containername} poanetwork/tokenbridge-monitor:${IMAGETAG} \
        /bin/bash -c 'yarn check-all'
    else
      echo "${containername} have not finished yet" >&2
    fi
    
    echo "========================================"
  done
  
  tend=`date +"%s"`
  tdiff=`expr ${tend} - ${tstart}`
  echo "Total time to run: ${tdiff}"

else
  echo "Monitor is not running, skipping checks."
fi