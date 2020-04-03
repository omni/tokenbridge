import React from 'react'
import ReactDOM from 'react-dom'
import BurnerCore from '@burner-wallet/core'
import { InjectedSigner, LocalSigner } from '@burner-wallet/core/signers'
import { InfuraGateway, InjectedGateway } from '@burner-wallet/core/gateways'
import Exchange from '@burner-wallet/exchange'
import ModernUI from '@burner-wallet/modern-ui'
import { Etc, Wetc, EtcGateway, WETCBridge } from 'tokenbridge-plugin'
import MetamaskPlugin from '@burner-wallet/metamask-plugin'

const core = new BurnerCore({
  signers: [new InjectedSigner(), new LocalSigner()],
  gateways: [new InjectedGateway(), new InfuraGateway(process.env.REACT_APP_INFURA_KEY), new EtcGateway()],
  assets: [Wetc, Etc]
})

const exchange = new Exchange({
  pairs: [new WETCBridge()]
})

const BurnerWallet = () => <ModernUI title="Basic Wallet" core={core} plugins={[exchange, new MetamaskPlugin()]} />

ReactDOM.render(<BurnerWallet />, document.getElementById('root'))
