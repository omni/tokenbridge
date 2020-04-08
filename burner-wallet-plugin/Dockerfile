FROM node:12 as plugin-base

WORKDIR /mono
COPY package.json .
COPY contracts/package.json ./contracts/
COPY commons/package.json ./commons/

COPY burner-wallet-plugin/package.json ./burner-wallet-plugin/
COPY burner-wallet-plugin/lerna.json ./burner-wallet-plugin/
COPY burner-wallet-plugin/yarn.lock ./burner-wallet-plugin/
COPY burner-wallet-plugin/tsconfig.json ./burner-wallet-plugin/
COPY burner-wallet-plugin/tokenbridge-plugin/package.json ./burner-wallet-plugin/tokenbridge-plugin/
COPY burner-wallet-plugin/staging/package.json ./burner-wallet-plugin/staging/
COPY burner-wallet-plugin/testing/package.json ./burner-wallet-plugin/testing/
COPY yarn.lock .
RUN yarn install --production --frozen-lockfile

COPY ./contracts ./contracts
RUN yarn run compile:contracts
RUN mv ./contracts/build ./ && rm -rf ./contracts/* ./contracts/.[!.]* && mv ./build ./contracts/

COPY ./commons ./commons

COPY ./burner-wallet-plugin/tokenbridge-plugin ./burner-wallet-plugin/tokenbridge-plugin
RUN yarn build:plugin


FROM plugin-base as testing
COPY ./burner-wallet-plugin/testing ./burner-wallet-plugin/testing
WORKDIR /mono/burner-wallet-plugin
CMD ["yarn", "start-testing"]


FROM plugin-base as staging
COPY ./burner-wallet-plugin/staging ./burner-wallet-plugin/staging
WORKDIR /mono/burner-wallet-plugin
CMD ["yarn", "start-staging"]
