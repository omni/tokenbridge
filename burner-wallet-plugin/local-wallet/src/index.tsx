import React from 'react'
import ReactDOM from 'react-dom'
import { NativeAsset, ERC20Asset } from '@burner-wallet/assets'
import BurnerCore from '@burner-wallet/core'
import { InjectedSigner, LocalSigner } from '@burner-wallet/core/signers'
import { HTTPGateway, InfuraGateway, InjectedGateway } from '@burner-wallet/core/gateways'
import ModernUI from '@burner-wallet/modern-ui'
import Exchange from '@burner-wallet/exchange'
import { Bridge } from 'tokenbridge-plugin'
import MetamaskPlugin from '@burner-wallet/metamask-plugin'

const core = new BurnerCore({
  signers: [new InjectedSigner(), new LocalSigner({ privateKey: process.env.REACT_APP_PK, saveKey: false })],
  gateways: [
    new InjectedGateway(),
    new HTTPGateway('https://sokol.poa.network', '77'),
    new InfuraGateway(process.env.REACT_APP_INFURA_KEY)
  ],
  assets: [
    new ERC20Asset({
      id: 'kspoa',
      name: 'KsPoa',
      network: '42',
      // @ts-ignore
      address: '0xff94183659f549D6273349696d73686Ee1d2AC83'
    }),
    new NativeAsset({
      id: 'spoa',
      name: 'sPoa',
      network: '77'
    })
  ]
})

const exchange = new Exchange({
  pairs: [
    new Bridge({
      assetA: 'spoa',
      assetABridge: '0x867949C3F2f66D827Ed40847FaA7B3a369370e13',
      assetB: 'kspoa',
      assetBBridge: '0x99FB1a25caeB9c3a5Bf132686E2fe5e27BC0e2dd'
    })
  ]
})

const BurnerWallet = () => <ModernUI title="Local Wallet" core={core} plugins={[exchange, new MetamaskPlugin()]} />

ReactDOM.render(<BurnerWallet />, document.getElementById('root'))
