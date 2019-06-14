FROM node:10

WORKDIR /mono
COPY package.json .
COPY oracle-e2e/package.json ./oracle-e2e/
COPY contracts/package.json ./contracts/

COPY yarn.lock .
RUN yarn install --frozen-lockfile
COPY ./contracts ./contracts
RUN yarn install:deploy
RUN yarn compile:contracts

COPY . .
