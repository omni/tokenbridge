import BridgeableERC20Asset from './BridgeableERC20Asset'

export default new BridgeableERC20Asset({
  id: 'bridgeable-dai',
  name: 'Dai (bridgeable)',
  network: '1',
  address: '0x6b175474e89094c44da98b954eedeac495271d0f',
  usdPrice: 1,
  icon: 'https://static.burnerfactory.com/icons/mcd.svg',
  bridgeAddress: '0xf6edFA16926f30b0520099028A145F4E06FD54ed'
})
