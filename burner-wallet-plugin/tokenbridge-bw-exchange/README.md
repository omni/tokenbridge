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

#### WETCBridge example
In this example, we use `TokenBridgeGateway` for connecting to the Ethereum Classic and `InfuraGateway` for connecting to the Ethereum Mainnet.

`WETCBridge` operates with two assets: `WETC` (Ethereum Mainnet) and `ETC` (Ethereum Classic), they should be added in the assets list.

```javascript
import BurnerCore from '@burner-wallet/core'
import Exchange from '@burner-wallet/exchange'
import { LocalSigner } from '@burner-wallet/core/signers'
import { Etc, Wetc, TokenBridgeGateway, WETCBridge } from '@poanet/tokenbridge-bw-exchange'
import { InfuraGateway } from '@burner-wallet/core/gateways'

const core = new BurnerCore({
  signers: [new LocalSigner()],
  gateways: [new TokenBridgeGateway(), new InfuraGateway(process.env.REACT_APP_INFURA_KEY)],
  assets: [Wetc, Etc]
})

const exchange = new Exchange({
  pairs: [new WETCBridge()]
})
```

### Using several exchanges simultaneously
In this example, we use `TokenBridgeGateway` for connecting to the qDAI chain, `XDaiGatewai` for connecting to the xDAI chain and `InfuraGateway` for connecting to the Ethereum Mainnet and Rinkeby Network.

`QDAIBridge` operates with two assets: `qDAI` (qDAI chain) and `DAI` (Ethereum Mainnet). Note that we use a custom DAI token from the `@poanet/tokenbridge-bw-exchange`, this is necessary for allowing bridge operations on this token.

`MOONBridge` operates with two assets: `MOON` (Rinkeby network) and `xMOON` (xDAI chain).

All four assets should be added to the assets list.

```javascript
import BurnerCore from '@burner-wallet/core'
import Exchange from '@burner-wallet/exchange'
import { LocalSigner } from '@burner-wallet/core/signers'
import { InfuraGateway, XDaiGateway } from '@burner-wallet/core/gateways'
import { Dai, qDai, MOON, xMOON, TokenBridgeGateway, QDAIBridge, MOONBridge } from '@poanet/tokenbridge-bw-exchange'

const core = new BurnerCore({
  signers: [new LocalSigner()],
  gateways: [new TokenBridgeGateway(), new XDaiGateway(), new InfuraGateway(process.env.REACT_APP_INFURA_KEY)],
  assets: [Dai, qDai, MOON, xMOON]
})

const exchange = new Exchange({
  pairs: [new QDAIBridge(), new MOONBridge()]
})
```

This is how the exchange plugin will look like:

![exchange-wetc](https://user-images.githubusercontent.com/4614574/80991095-e40d0900-8e0d-11ea-9915-1b4e4a052694.png) 
