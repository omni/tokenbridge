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
COPY monitor/package.json ./monitor/
COPY yarn.lock .
RUN NOYARNPOSTINSTALL=1 yarn install --frozen-lockfile --production

COPY ./commons ./commons
COPY ./monitor ./monitor

WORKDIR /mono/monitor
CMD echo "To start the monitor web service run:" \
  "yarn start" \
  "To run monitor scripts run:" \
  "yarn check-all"
