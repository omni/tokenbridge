export const HOME_BRIDGE_ADDRESS: string = process.env.REACT_APP_COMMON_HOME_BRIDGE_ADDRESS || ''
export const FOREIGN_BRIDGE_ADDRESS: string = process.env.REACT_APP_COMMON_FOREIGN_BRIDGE_ADDRESS || ''

export const HOME_RPC_URL: string = process.env.REACT_APP_COMMON_HOME_RPC_URL || ''
export const FOREIGN_RPC_URL: string = process.env.REACT_APP_COMMON_FOREIGN_RPC_URL || ''

export const networks: { [key: number]: string } = {
  1: 'ETH Mainnet',
  42: 'Kovan Testnet',
  61: 'Ethereum Classic',
  77: 'Sokol Testnet',
  99: 'POA Network',
  100: 'xDai Chain'
}

export const TRANSACTION_STATUS = {
  SUCCESS_MULTIPLE_MESSAGES: 'SUCCESS_MULTIPLE_MESSAGES',
  SUCCESS_ONE_MESSAGE: 'SUCCESS_ONE_MESSAGE',
  SUCCESS_NO_MESSAGES: 'SUCCESS_NO_MESSAGES',
  FAILED: 'FAILED',
  NOT_FOUND: 'NOT_FOUND'
}
