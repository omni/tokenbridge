FROM node:8

WORKDIR /mono
COPY package.json .
COPY contracts/package.json ./contracts/
COPY monitor/package.json ./monitor/
COPY yarn.lock .
RUN yarn install --frozen-lockfile --production

COPY ./contracts ./contracts
RUN yarn run compile:contracts
RUN mv ./contracts/build ./ && rm -rf ./contracts/* ./contracts/.[!.]* && mv ./build ./contracts/

COPY ./monitor ./monitor
WORKDIR /mono/monitor
CMD echo "To start the monitor run:" \
  "yarn start"
