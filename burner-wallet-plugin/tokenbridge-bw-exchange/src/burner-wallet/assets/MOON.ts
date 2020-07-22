import BridgeableERC20Asset from './BridgeableERC20Asset'

export default new BridgeableERC20Asset({
  id: 'moon',
  name: 'MOON',
  network: '4',
  address: '0xDF82c9014F127243CE1305DFE54151647d74B27A',
  icon: 'https://blockscout.com/poa/xdai/images/icons/moon.png',
  bridgeModes: ['erc-to-erc-amb']
})
