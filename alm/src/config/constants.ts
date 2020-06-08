export const HOME_BRIDGE_ADDRESS: string = process.env.REACT_APP_COMMON_HOME_BRIDGE_ADDRESS || ''
export const FOREIGN_BRIDGE_ADDRESS: string = process.env.REACT_APP_COMMON_FOREIGN_BRIDGE_ADDRESS || ''

export const HOME_RPC_URL: string = process.env.REACT_APP_COMMON_HOME_RPC_URL || ''
export const FOREIGN_RPC_URL: string = process.env.REACT_APP_COMMON_FOREIGN_RPC_URL || ''

export const HOME_NETWORK_NAME: string = process.env.REACT_APP_ALM_HOME_NETWORK_NAME || ''
export const FOREIGN_NETWORK_NAME: string = process.env.REACT_APP_ALM_FOREIGN_NETWORK_NAME || ''

export const TRANSACTION_STATUS = {
  SUCCESS_MULTIPLE_MESSAGES: 'SUCCESS_MULTIPLE_MESSAGES',
  SUCCESS_ONE_MESSAGE: 'SUCCESS_ONE_MESSAGE',
  SUCCESS_NO_MESSAGES: 'SUCCESS_NO_MESSAGES',
  FAILED: 'FAILED',
  NOT_FOUND: 'NOT_FOUND'
}
