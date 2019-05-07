FROM node:8

RUN apt-get update
RUN apt-get install -y build-essential
RUN apt-get install -y libc6-dev
RUN apt-get install -y libc6-dev-i386
RUN apt-get install -y wget
RUN apt-get clean

WORKDIR /bridge
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .
CMD echo "To start a bridge process run:" \
  "VALIDATOR_ADDRESS=<validator address> VALIDATOR_ADDRESS_PRIVATE_KEY=<validator address private key> docker-compose up -d --build"
