#!/bin/bash

while read line; do
  if [ "$line" = "" ]; then
    : # Skip empty lines
  elif [[ "$line" =~ \#.* ]]; then
    : # Skip comment lines
  elif [[ "$line" =~ "UI_PORT"* ]]; then
    eval $line
    export PORT="$UI_PORT"
  else
    export "REACT_APP_$line"
  fi
done < '.env'

$*
