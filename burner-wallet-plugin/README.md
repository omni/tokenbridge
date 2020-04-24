# TokenBridge Burner Wallet 2 Plugin

This plugin defines a Bridge trading pair to be used in the Exchange Plugin.

Bridge trading pairs and assets supported:
* ETC - WETC Bridge

It also provides some generic resources that can be used and extended:
* **ERC677Asset** - A representation of an Erc677 token
* **NativeMediatorAsset** - Represents a native token that interacts with a Mediator extension.
* **Mediator Pair** - Represents an Exchange Pair that interacts with mediators extensions.
* **TokenBridgeGateway** - A gateway to operate with ETC, POA Sokol and POA Core networks. 
 
### Usage

```javascript
import { Etc, Wetc, EtcGateway, WETCBridge } from 'burner-wallet-plugin/tokenbridge-bw-exchange'

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

