set -e # exit when any command fails

usage() {
  echo "env validator usage:"
  echo "./env.sh validate {oracle,ui,monitor} <path/to/.env} - validate configuration environment parameters"
  echo "./env.sh description - print out description of all parameters"
  echo "./env.sh print - prints out markdown"
}

validate() {
  if [ ! -f "$2" ]; then
    echo "Invalid path to .env file"
    exit -1
  fi

  if [ "$1" == "oracle" ]; then
    MODE=VALIDATE_ORACLE env $(cat "$2" | xargs) node validator.js
    exit "$?"
  fi

  if [ "$1" == "ui" ]; then
    MODE=VALIDATE_UI node validator.js
    exit "$?"
  fi

  if [ "$1" == "monitor" ]; then
    MODE=VALIDATE_MONITOR node validator.js
    exit "$?"
  fi
}

if [ "$1" == "description" ]; then
  node validator.js
elif [ "$1" == "validate" ]; then
  validate "$2" "$3"
elif [ "$1" == "print" ]; then
  echo "Not implemented"
  exit -1
else
  usage
fi
