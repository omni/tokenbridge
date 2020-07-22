import React from 'react'
import ReactDOM from 'react-dom'
import BurnerCore from '@burner-wallet/core'
import { InjectedSigner, LocalSigner } from '@burner-wallet/core/signers'
import { XDaiBridge } from '@burner-wallet/exchange'
import { xdai } from '@burner-wallet/assets'
import { InfuraGateway, InjectedGateway, XDaiGateway } from '@burner-wallet/core/gateways'
import Exchange from '@burner-wallet/exchange'
import ModernUI from '@burner-wallet/modern-ui'
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
import MetamaskPlugin from '@burner-wallet/metamask-plugin'

const core = new BurnerCore({
  signers: [new InjectedSigner(), new LocalSigner()],
  gateways: [
    new InjectedGateway(),
    new XDaiGateway(),
    new InfuraGateway(process.env.REACT_APP_INFURA_KEY),
    new TokenBridgeGateway()
  ],
  assets: [xdai, Wetc, Etc, Dai, qDai, MOON, xMOON]
})

const exchange = new Exchange([new XDaiBridge(), new WETCBridge(), new QDAIBridge(), new MOONBridge()])

const BurnerWallet = () => <ModernUI title="Staging Wallet" core={core} plugins={[exchange, new MetamaskPlugin()]} />

ReactDOM.render(<BurnerWallet />, document.getElementById('root'))
