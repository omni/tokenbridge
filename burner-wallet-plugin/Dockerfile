FROM node:12 as plugin-base

WORKDIR /mono
COPY package.json .
RUN mkdir -p contracts/node_modules

COPY burner-wallet-plugin/package.json ./burner-wallet-plugin/
COPY burner-wallet-plugin/lerna.json ./burner-wallet-plugin/
COPY burner-wallet-plugin/yarn.lock ./burner-wallet-plugin/
COPY burner-wallet-plugin/tsconfig.json ./burner-wallet-plugin/
COPY burner-wallet-plugin/tokenbridge-bw-exchange/package.json ./burner-wallet-plugin/tokenbridge-bw-exchange/
COPY burner-wallet-plugin/staging/package.json ./burner-wallet-plugin/staging/
COPY burner-wallet-plugin/testing/package.json ./burner-wallet-plugin/testing/
COPY yarn.lock .
RUN yarn install --production --frozen-lockfile

COPY ./burner-wallet-plugin/tokenbridge-bw-exchange ./burner-wallet-plugin/tokenbridge-bw-exchange
RUN yarn build:plugin


FROM plugin-base as testing
COPY ./burner-wallet-plugin/testing ./burner-wallet-plugin/testing
WORKDIR /mono/burner-wallet-plugin
CMD ["yarn", "start-testing"]


FROM plugin-base as staging
COPY ./burner-wallet-plugin/staging ./burner-wallet-plugin/staging
WORKDIR /mono/burner-wallet-plugin
CMD ["yarn", "start-staging"]
