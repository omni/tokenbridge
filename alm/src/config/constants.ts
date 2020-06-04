export const HOME_BRIDGE_ADDRESS: string = process.env.COMMON_HOME_BRIDGE_ADDRESS || ''
export const FOREIGN_BRIDGE_ADDRESS: string = process.env.COMMON_FOREIGN_BRIDGE_ADDRESS || ''

export const HOME_RPC_URL: string = process.env.COMMON_HOME_RPC_URL || ''
export const FOREIGN_RPC_URL: string = process.env.COMMON_FOREIGN_RPC_URL || ''

const networks = {
  1: 'ETH Mainnet',
  42: 'Kovan Testnet',
  61: 'Ethereum Classic',
  77: 'Sokol Testnet',
  99: 'POA Network',
  100: 'xDai Chain'
}
