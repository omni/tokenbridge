FROM node:10 as contracts

WORKDIR /mono

COPY contracts/package.json contracts/package-lock.json ./contracts/

WORKDIR /mono/contracts
RUN npm install --only=prod

COPY ./contracts/truffle-config.js ./
COPY ./contracts/contracts ./contracts
RUN npm run compile

FROM node:10

WORKDIR /mono
COPY package.json .
COPY --from=contracts /mono/contracts/build ./contracts/build
COPY commons/package.json ./commons/
COPY ui/package.json ./ui/
COPY ui/lib/web3-eth/index.js ./ui/lib/web3-eth/index.js
COPY yarn.lock .
RUN NOYARNPOSTINSTALL=1 yarn install --frozen-lockfile --production

COPY ./commons ./commons
COPY ./ui ./ui

ARG DOT_ENV_PATH=./ui/.env
COPY ${DOT_ENV_PATH} ./ui/.env

WORKDIR /mono/ui
CMD echo "To start a UI application run:" \
  "yarn start"
