#!/bin/bash
set -e # exit when any command fails

usage() {
  echo "env validator usage:"
  echo "./env.sh validate <path/to/.env> ...components - validate configuration environment parameters. e.g. ./env.sh validate ../oracle/.env oracle"
  echo "./env.sh description - print out description of all parameters"
  echo "./env.sh print - prints out markdown"
}

export_parameters_from_file() {
  [ ! -f "$1" ] && (echo "Invalid path to .env file"; exit -1)

  set -o allexport
  source "$1"
  set +o allexport
}

validate() {
  export_parameters_from_file "$1"

  while [ "$2" != "" ]; do
    [ "$2" == "oracle" ] && export VALIDATE_ORACLE=true
    [ "$2" == "ui" ] && export VALIDATE_UI=true
    [ "$2" == "monitor" ] && export VALIDATE_MONITOR=true
    shift # Shift all the parameters down by one
  done

  MODE=VALIDATE node validator.js
}

if [ "$1" == "description" ]; then
  node validator.js
elif [ "$1" == "validate" ]; then
  validate "$2" "$3"
elif [ "$1" == "print" ]; then
  MODE=PRINT node validator.js
else
  usage
fi
