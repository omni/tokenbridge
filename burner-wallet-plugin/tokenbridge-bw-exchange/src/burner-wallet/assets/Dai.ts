import BridgeableERC20Asset from './BridgeableERC20Asset'

export default new BridgeableERC20Asset({
  id: 'dai',
  name: 'Dai',
  network: '1',
  address: '0x6b175474e89094c44da98b954eedeac495271d0f',
  usdPrice: 1,
  icon: 'https://static.burnerfactory.com/icons/mcd.svg',
  bridgeModes: ['erc-to-native-amb']
})
