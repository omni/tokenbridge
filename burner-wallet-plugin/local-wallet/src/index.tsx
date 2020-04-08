import React from 'react'
import ReactDOM from 'react-dom'
import { NativeAsset } from '@burner-wallet/assets'
import BurnerCore from '@burner-wallet/core'
import { InjectedSigner, LocalSigner } from '@burner-wallet/core/signers'
import { InfuraGateway, InjectedGateway } from '@burner-wallet/core/gateways'
import ModernUI from '@burner-wallet/modern-ui'
import Exchange from '@burner-wallet/exchange'
import { Bridge, ERC677Asset, TokenBridgeGateway } from 'tokenbridge-plugin'
import MetamaskPlugin from '@burner-wallet/metamask-plugin'

// amb Native-to-erc677
const spoa = new NativeAsset({
  id: 'spoa',
  name: 'sPoa',
  network: '77'
})

const kspoa = new ERC677Asset({
  id: 'kspoa',
  name: 'KsPoa',
  network: '42',
  address: '0xff94183659f549D6273349696d73686Ee1d2AC83'
})

const ambNativeToErc677 = new Bridge({
  assetA: 'spoa',
  assetABridge: '0x867949C3F2f66D827Ed40847FaA7B3a369370e13',
  assetB: 'kspoa',
  assetBBridge: '0x99FB1a25caeB9c3a5Bf132686E2fe5e27BC0e2dd'
})

// amb Stake Erc677ToErc677
const sStake = new ERC677Asset({
  id: 'sstake',
  name: 'sStake',
  network: '77',
  address: '0xC462082Dd85b27a03f380fa4C7abE90E43A986D1'
})

const kStake = new ERC677Asset({
  id: 'kstake',
  name: 'kStake',
  network: '42',
  address: '0xEda3320c159eeF5847DE491976775EC5Fca31000'
})

const ambStakeErc677ToErc677 = new Bridge({
  assetA: 'sstake',
  assetABridge: '0x13CCE500C577ae275E87111c465A5caF02766dd1',
  assetB: 'kstake',
  assetBBridge: '0x6e424386384E84d1bAc49397B383b353e412ddAf'
})

// Core burner component
const core = new BurnerCore({
  signers: [new InjectedSigner(), new LocalSigner({ privateKey: process.env.REACT_APP_PK, saveKey: false })],
  gateways: [new InjectedGateway(), new TokenBridgeGateway(), new InfuraGateway(process.env.REACT_APP_INFURA_KEY)],
  assets: [spoa, kspoa, sStake, kStake]
})

// Exchange component
const exchange = new Exchange({
  pairs: [ambNativeToErc677, ambStakeErc677ToErc677]
})

const BurnerWallet = () => <ModernUI title="Local Wallet" core={core} plugins={[exchange, new MetamaskPlugin()]} />

ReactDOM.render(<BurnerWallet />, document.getElementById('root'))
