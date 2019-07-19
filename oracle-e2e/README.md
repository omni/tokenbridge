# POA TokenBridge / Oracle-E2E

End to end tests for the POA TokenBridge [Oracle](../oracle/README.md).

## Prerequisites

To run the tests you need to have
[Docker](https://www.docker.com/community-edition) and
[Docker Compose](https://docs.docker.com/compose/install/) installed.
If you are on Linux, it's also recommended that you [create a docker group and
add your user to it](https://docs.docker.com/install/linux/linux-postinstall/),
so that you can use the CLI without sudo.

## Running

To run the bridge end-to-end tests, you just have to run:

```
./run-tests.sh
```

If this is the first time that you do this, it will take some time to build the
docker images, but the next time they will be cached.

## How it works

The script starts several containers and then use them to run the tests. These
services are:

- Two parity nodes with the InstanSeal engine, representing the home and foreign
  chains.
- A Redis container.
- A RabbitMQ container.
- The bridge (without doing anything at first)
- The container for the end-to-end tests (also without doing anything)

Afterwards, contracts will be deployed to the respective chains, all the bridge
scripts will be executed (using the bridge service) and tests (using the e2e
service) will be executed. The last process exit code will be used as the result
of the testing suite.

## Debugging

Sometimes you may need to look into what happened in each service after running
the tests. For doing this, comment out the `docker-compose down` line in the
`run-tests.sh` file, and all the containers will be kept running after the
script finishes. Some things you can do:

- Connect to the home chain using `http://localhost:8541` as the URL.
- Connect to the foreign chain using `http://localhost:8542` as the URL.
- Open the RabbitMQ Management service (go to `http://localhost:15672` in the
  browser and log in with username/password `guest/guest`).
- Inspect the logs using `docker logs CONTAINER`. You can obtain the container
  name with the `docker ps` command.
