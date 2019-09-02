set -e # exit when any command fails

usage() {
  echo "validate usage:"
  echo "./validate.sh {oracle,ui,monitor} <path/to/.env} - validate configuration environment parameters"
  echo "./validate.sh description - print out description of all parameters"
}

if [ "$1" == "description" ]; then
  node validator.js
  exit 0
fi

if [ "$1" == "oracle" ]; then
  MODE=VALIDATE_ORACLE node validator.js
  exit 0
fi

if [ "$1" == "ui" ]; then
  MODE=VALIDATE_UI node validator.js
  exit 0
fi

if [ "$1" == "monitor" ]; then
  MODE=VALIDATE_MONITOR node validator.js
  exit 0
fi

usage
