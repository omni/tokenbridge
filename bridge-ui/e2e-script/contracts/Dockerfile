FROM node:8

RUN mkdir /stuff
WORKDIR /stuff

RUN git clone https://github.com/poanetwork/poa-bridge-contracts.git

RUN mkdir submodules && \
  mv poa-bridge-contracts submodules && \
  cd submodules/poa-bridge-contracts && \
  git fetch && \
  git checkout 2.1.0

RUN cd submodules/poa-bridge-contracts && \
  npm install && \
  ./node_modules/.bin/truffle compile && \
  cd deploy && \
  npm install
COPY deploy.sh .
COPY contracts.env submodules/poa-bridge-contracts/deploy/
COPY erc-contracts.env submodules/poa-bridge-contracts/deploy/
COPY erc-native-contracts.env submodules/poa-bridge-contracts/deploy/
COPY deployERC20.js submodules/poa-bridge-contracts/deploy/
RUN cd submodules/poa-bridge-contracts/deploy && cp contracts.env .env
