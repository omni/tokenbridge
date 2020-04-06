FROM node:12

WORKDIR /mono
COPY package.json .
COPY contracts/package.json ./contracts/
COPY commons/package.json ./commons/

COPY burner-wallet-plugin/package.json ./burner-wallet-plugin/
COPY burner-wallet-plugin/lerna.json ./burner-wallet-plugin/
COPY burner-wallet-plugin/yarn.lock ./burner-wallet-plugin/
COPY burner-wallet-plugin/tsconfig.json ./burner-wallet-plugin/
COPY burner-wallet-plugin/tokenbridge-plugin/package.json ./burner-wallet-plugin/tokenbridge-plugin/
COPY burner-wallet-plugin/basic-wallet/package.json ./burner-wallet-plugin/basic-wallet/
COPY burner-wallet-plugin/local-wallet/package.json ./burner-wallet-plugin/local-wallet/
COPY yarn.lock .
RUN yarn install --production --frozen-lockfile

COPY ./contracts ./contracts
RUN yarn run compile:contracts
RUN mv ./contracts/build ./ && rm -rf ./contracts/* ./contracts/.[!.]* && mv ./build ./contracts/

COPY ./commons ./commons

COPY ./burner-wallet-plugin/tokenbridge-plugin ./burner-wallet-plugin/tokenbridge-plugin
RUN yarn build:plugin

COPY ./burner-wallet-plugin/basic-wallet ./burner-wallet-plugin/basic-wallet
COPY ./burner-wallet-plugin/local-wallet ./burner-wallet-plugin/local-wallet

WORKDIR /mono/burner-wallet-plugin

CMD ["yarn", "start-local"]
