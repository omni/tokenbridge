FROM node:10

WORKDIR /mono
COPY package.json .
COPY oracle/package.json ./oracle/
COPY oracle-e2e/package.json ./oracle-e2e/
COPY ui/package.json ./ui/
COPY ui-e2e/package.json ./ui-e2e/
COPY monitor/package.json ./monitor/
COPY contracts/package.json ./contracts/
COPY ui/lib/web3-eth/index.js ./ui/lib/web3-eth/index.js
COPY yarn.lock .

RUN yarn install
COPY . .

RUN yarn workspace poa-parity-bridge-contracts run compile
RUN cd contracts-2.2.0 && rm -f package-lock.json && npm install --silent && npm install --silent truffle@4.1.11 && npm run compile && cd deploy && rm -f package-lock.json && npm install --silent && npm install --silent web3@1.0.0-beta.33
RUN cd contracts-2.1.0 && rm -f package-lock.json && npm install --silent && npm install --silent truffle@4.1.11 && npm run compile && cd deploy && rm -f package-lock.json && npm install --silent && npm install --silent web3@1.0.0-beta.33
RUN yarn workspace ui run compile:contracts && yarn workspace ui run postinstall
RUN cd contracts/deploy && rm -f package-lock.json && npm install
