#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

echo "Starting app deployment..."

echo "Installing node packages"
npm install

echo "Removing build directory"
rm -rf build

echo "Building"
yarn build

echo "Deploying to environment"
aws s3 sync build s3://stg3-token-bridge --delete --acl public-read --profile "deploy-stg3"

echo "Deployment for finished!"
echo "http://stg3-token-bridge.s3-website.eu-north-1.amazonaws.com/"
