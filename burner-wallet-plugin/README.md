# TokenBridge Burner Wallet 2 Plugin

Please refer to the [Plugin README](./tokenrbdige-bw-exchange/README.md) for resources provided, instructions to install and use the plugin.

### Setup
1. [Initialize](../README.md#initializing-the-monorepository) the monorepository.
2. Run `yarn build` or from the monorepository root `yarn build:plugin`

### Run Burner Wallet with the plugin in Mainnet & Classic
1. Create `.env` file in `staging` folder and set `REACT_APP_INFURA_KEY=<your key from infura.com>`
2. Run `yarn start-staging` to start the wallet connected to Mainnet & Classic and interact with the ETH - WETC Bridge.

### Run Burner Wallet with the plugin in Sokol & Kovan
1. Create `.env` file in `testing` folder and set `REACT_APP_INFURA_KEY=<your key from infura.com>`. 
Also, a private key can be set to start the wallet with the specified account `REACT_APP_PK=0x...`
2. Run `yarn start-testing` to start the wallet connected to Sokol & Kovan and interact with a test bridge
that works on top of the AMB bridge.

### Docker Setup
Docker can be used to build the services and run the testing and staging wallets.

First you may want to create the `.env` files for testing and staging as mentioned before. This is optional before building the containers, variables can be passes later using `--env-file` or `--env` parameters in `docker run`.

Build the services with docker-compose:
```bash
docker-compose build
```

### Run Burner Wallet with the plugin in Mainnet & Classic using Docker 
```bash
docker run -ti -p 8080:8080 -e PORT=8080 --rm burner-wallet-plugin_staging
```

### Run Burner Wallet with the plugin in Sokol & Kovan using Docker
```bash
docker run -ti -p 8080:8080 -e PORT=8080 --rm burner-wallet-plugin_testing
```
### Publish to npm
In order to make this plugin accessible, it should be available as a npm package. Follow the [instructions](publish.md) to publish 
the package to npm registry. 

