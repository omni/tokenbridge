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
1. Clone the repo
2. Run `yarn install`. This repo uses Lerna and Yarn Workspaces, so `yarn install` will install
  all dependencies and link modules in the repo
3. Run `yarn build`

### Run Burner Wallet with the plugin in Mainnet & Classic
1. Create `.env` file in `basic-wallet` folder and set `REACT_APP_INFURA_KEY=<your key from infura.com>`
2. Run `yarn start-basic` to start the wallet connected to Mainnet & Classic and interact with the ETH - WETC Bridge.

### Run Burner Wallet with the plugin in Sokol & Kovan
1. Create `.env` file in `local-wallet` folder and set `REACT_APP_INFURA_KEY=<your key from infura.com>`. 
Also, a private key can be set to start the wallet with the specified account `REACT_APP_PK=0x...`
2. Run `yarn start-local` to start the wallet connected to Sokol & Kovan and interact with a test bridge sPoa - sPoa20
that works on top of the AMB bridge.

