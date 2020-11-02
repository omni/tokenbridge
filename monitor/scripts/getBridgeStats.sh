#!/bin/bash

CONFIGDIR="configs"
RESPONSESDIR="responses"
ACLDIR="access-lists"
ALLOWANCEFILE="allowance_list.txt"
BLOCKFILE="block_list.txt"
CACHEDIR="cache"
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
    checksumfile=${bridgename}".shasum"
    rm -f ${checksumfile}
    for json in alerts.json eventsStats.json getBalances.json validators.json stuckTransfers.json; do
      if [ -f ${reportdir}/${json} ]; then
        shasum -a 256 ${reportdir}/${json} >> ${checksumfile}
      fi
    done

    alist=`source ${file} && echo ${MONITOR_HOME_TO_FOREIGN_ALLOWANCE_LIST}`
    blist=`source ${file} && echo ${MONITOR_HOME_TO_FOREIGN_BLOCK_LIST}`
    al_param="$(pwd)/${ACLDIR}/${bridgename}/${ALLOWANCEFILE}:/mono/monitor/access-lists/allowance_list.txt"
    bl_param="$(pwd)/${ACLDIR}/${bridgename}/${BLOCKFILE}:/mono/monitor/access-lists/block_list.txt"

    containername=${bridgename}"-checker"
    docker container stats --no-stream ${containername} 2>/dev/null 1>&2
    if [ ! "$?" == "0" ]; then
      mkdir -p "$(pwd)/$CACHEDIR/$bridgename"
      docker run --rm --env-file $file -v $(pwd)/${RESPONSESDIR}:/mono/monitor/responses \
        ${alist:+"-v"} ${alist:+"$al_param"} ${blist:+"-v"} ${blist:+"$bl_param"} \
        -v $(pwd)/${CACHEDIR}/${bridgename}:/mono/monitor/cache/${bridgename} \
        --name ${containername} poanetwork/tokenbridge-monitor:${IMAGETAG} \
        /bin/bash -c 'yarn check-all'
      shasum -a 256 -s -c ${checksumfile}
      if [ "$?" == "0" ]; then
        echo "JSON files have not been updated - the monitor is not healthy"
        for json in alerts.json eventsStats.json getBalances.json validators.json stuckTransfers.json; do
          if [ -f ${reportdir}/${json} ]; then
            echo '{"health": false, "lastChecked": '`date +"%s"`'}' > ${reportdir}/${json}
          fi
        done
      else
        echo "JSON files have been updated - new metrics collected"
      fi
    else
      echo "${containername} have not finished yet" >&2
    fi

    rm ${checksumfile}
    echo "========================================"
  done

  tend=`date +"%s"`
  tdiff=`expr ${tend} - ${tstart}`
  echo "Total time to run: ${tdiff}"

else
  echo "Monitor is not running, skipping checks."
fi
