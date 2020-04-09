import React from 'react'
import ReactDOM from 'react-dom'
import { Asset } from '@burner-wallet/assets'
import BurnerCore from '@burner-wallet/core'
import { InjectedSigner, LocalSigner } from '@burner-wallet/core/signers'
import { InfuraGateway, InjectedGateway } from '@burner-wallet/core/gateways'
import ModernUI from '@burner-wallet/modern-ui'
import Exchange from '@burner-wallet/exchange'
import { Bridge, sPOA, ERC677Asset, TokenBridgeGateway } from 'tokenbridge-plugin'
import MetamaskPlugin from '@burner-wallet/metamask-plugin'

let assetIdAtHome = 'assetAtHome'
const assetIdAtForeign = 'assetAtForeign'
let assetAtHome: Asset
let assetAtForeign: Asset

if (process.env.REACT_APP_MODE === 'AMB_NATIVE_TO_ERC677') {
  assetAtHome = sPOA
  assetIdAtHome = sPOA.id

  assetAtForeign = new ERC677Asset({
    id: 'assetAtForeign',
    name: process.env.REACT_APP_FOREIGN_TOKEN_NAME,
    network: process.env.REACT_APP_FOREIGN_NETWORK,
    address: process.env.REACT_APP_FOREIGN_TOKEN_ADDRESS
  })
} else {
  // process.env.REACT_APP_MODE === 'AMB_ERC677_TO_ERC677'
  assetAtHome = new ERC677Asset({
    id: 'assetAtHome',
    name: process.env.REACT_APP_HOME_TOKEN_NAME,
    network: process.env.REACT_APP_HOME_NETWORK,
    address: process.env.REACT_APP_HOME_TOKEN_ADDRESS
  })

  assetAtForeign = new ERC677Asset({
    id: 'assetAtForeign',
    name: process.env.REACT_APP_FOREIGN_TOKEN_NAME,
    network: process.env.REACT_APP_FOREIGN_NETWORK,
    address: process.env.REACT_APP_FOREIGN_TOKEN_ADDRESS
  })
}

const testBridge = new Bridge({
  assetA: assetIdAtHome,
  // @ts-ignore
  assetABridge: process.env.REACT_APP_HOME_MEDIATOR_ADDRESS,
  assetB: assetIdAtForeign,
  // @ts-ignore
  assetBBridge: process.env.REACT_APP_FOREIGN_MEDIATOR_ADDRESS
})

const core = new BurnerCore({
  signers: [new InjectedSigner(), new LocalSigner({ privateKey: process.env.REACT_APP_PK, saveKey: false })],
  gateways: [new InjectedGateway(), new TokenBridgeGateway(), new InfuraGateway(process.env.REACT_APP_INFURA_KEY)],
  assets: [assetAtHome, assetAtForeign]
})

const exchange = new Exchange({
  pairs: [testBridge]
})

const BurnerWallet = () => <ModernUI title="Testing Wallet" core={core} plugins={[exchange, new MetamaskPlugin()]} />

ReactDOM.render(<BurnerWallet />, document.getElementById('root'))
