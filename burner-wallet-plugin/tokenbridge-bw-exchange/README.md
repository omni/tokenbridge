# TokenBridge Burner Wallet 2 Plugin

This plugin defines a Bridge trading pair to be used in the Exchange Plugin.

Bridge trading pairs and assets supported:
* ETC - WETC Bridge
* MOON - xMOON Bridge
* DAI - qDAI Bridge (For qDAI Bridge, it's necessary to use a custom DAI token from this repo instead of the DAI asset provided by burner-wallet)

It also provides some generic resources that can be used and extended:
* **ERC677Asset** - A representation of an Erc677 token.
* **BridgeableERC20Asset** - A representation of Erc20 token with a possibility of bridging it via a call to `relayTokens`.
* **NativeMediatorAsset** - Represents a native token that interacts with a Mediator extension.
* **Mediator Pair** - Represents an Exchange Pair that interacts with mediators extensions.
* **MediatorErcToNative Pair** - Represents a modified Mediator Pair that interacts with a tokenbridge erc-to-native mediators contracts.
* **TokenBridgeGateway** - A gateway to operate with ETC, POA Sokol, POA Core and qDAI networks.

### Install package
```
yarn add @poanet/tokenbridge-bw-exchange
```
 
### Usage

```javascript
import {
  Etc,
  Wetc,
  Dai,
  qDai,
  MOON,
  xMOON,
  TokenBridgeGateway,
  WETCBridge,
  QDAIBridge,
  MOONBridge
} from '@poanet/tokenbridge-bw-exchange'

const core = new BurnerCore({
  ...
  gateways: [new TokenBridgeGateway(), new InfuraGateway(process.env.REACT_APP_INFURA_KEY)],
  assets: [Wetc, Etc, Dai, qDai, MOON, xMOON]
})

const exchange = new Exchange({
  pairs: [new WETCBridge(), new QDAIBridge(), new MOONBridge()]
})
```

This is how the exchange plugin will look like:

![exchange-wetc](https://user-images.githubusercontent.com/4614574/80991095-e40d0900-8e0d-11ea-9915-1b4e4a052694.png) 
