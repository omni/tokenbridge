FROM node:8

WORKDIR /mono
COPY package.json .
COPY contracts/package.json ./contracts/
COPY ui/package.json ./ui/
COPY ui/lib/web3-eth/index.js ./ui/lib/web3-eth/index.js
COPY yarn.lock .
RUN yarn install --production

COPY ./contracts ./contracts
RUN yarn run compile:contracts
RUN mv ./contracts/build ./ && rm -rf ./contracts/* ./contracts/.[!.]* && mv ./build ./contracts/

COPY ./ui ./ui
WORKDIR /mono/ui
CMD echo "To start a UI application run:" \
  "?"
