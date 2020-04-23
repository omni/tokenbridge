# TokenBridge Burner Wallet 2 Plugin

This plugin defines a Bridge trading pair to be used in the Exchange Plugin.

Bridge trading pairs supported:
* ETC - WETC Bridge

### Usage

```javascript
import { Etc, Wetc, EtcGateway, WETCBridge } from 'tokenbridge-plugin'

const core = new BurnerCore({
  ...
  gateways: [new EtcGateway(), new InfuraGateway(process.env.REACT_APP_INFURA_KEY)],
  assets: [Etc, Wetc]
})

const exchange = new Exchange({
  pairs: [new WETCBridge()]
})
```


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

### Publish to npm
In order to make this plugin accessible, it should be available as a npm package. Follow the [instructions](publish.md) to publish 
the package to npm registry. 

