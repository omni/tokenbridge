FROM node:10 as build-deps

WORKDIR /bridge
COPY package.json .
COPY package-lock.json .
COPY . .
RUN npm install
RUN npm run postinstall
