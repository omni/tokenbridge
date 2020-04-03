FROM node:12

WORKDIR /plugin

COPY package.json .
COPY lerna.json .
COPY yarn.lock .
COPY tsconfig.json .
COPY tokenbridge-plugin/package.json ./tokenbridge-plugin/
COPY basic-wallet/package.json ./basic-wallet/
COPY local-wallet/package.json ./local-wallet/
RUN yarn install

COPY ./tokenbridge-plugin ./tokenbridge-plugin
RUN yarn build

COPY ./basic-wallet ./basic-wallet
COPY ./local-wallet ./local-wallet
