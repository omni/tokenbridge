export const HOME_BRIDGE_ADDRESS: string = process.env.REACT_APP_COMMON_HOME_BRIDGE_ADDRESS || ''
export const FOREIGN_BRIDGE_ADDRESS: string = process.env.REACT_APP_COMMON_FOREIGN_BRIDGE_ADDRESS || ''

export const HOME_RPC_URL: string = process.env.REACT_APP_COMMON_HOME_RPC_URL || ''
export const FOREIGN_RPC_URL: string = process.env.REACT_APP_COMMON_FOREIGN_RPC_URL || ''

export const HOME_NETWORK_NAME: string = process.env.REACT_APP_ALM_HOME_NETWORK_NAME || ''
export const FOREIGN_NETWORK_NAME: string = process.env.REACT_APP_ALM_FOREIGN_NETWORK_NAME || ''

export const HOME_EXPLORER_TX_TEMPLATE: string = process.env.REACT_APP_ALM_HOME_EXPLORER_TX_TEMPLATE || ''
export const FOREIGN_EXPLORER_TX_TEMPLATE: string = process.env.REACT_APP_ALM_FOREIGN_EXPLORER_TX_TEMPLATE || ''

export const HOME_EXPLORER_API: string = process.env.REACT_APP_ALM_HOME_EXPLORER_API || ''
export const FOREIGN_EXPLORER_API: string = process.env.REACT_APP_ALM_FOREIGN_EXPLORER_API || ''

export const ALM_HOME_TO_FOREIGN_MANUAL_EXECUTION: boolean =
  (process.env.REACT_APP_ALM_HOME_TO_FOREIGN_MANUAL_EXECUTION || '').toLowerCase() === 'true'

export const HOME_RPC_POLLING_INTERVAL: number = 5000
export const FOREIGN_RPC_POLLING_INTERVAL: number = 5000
export const BLOCK_RANGE: number = 50
export const ONE_DAY_TIMESTAMP: number = 86400
export const THREE_DAYS_TIMESTAMP: number = 259200

export const EXECUTE_AFFIRMATION_HASH = 'e7a2c01f'
export const SUBMIT_SIGNATURE_HASH = '630cea8e'
export const EXECUTE_SIGNATURES_HASH = '3f7658fd'

export const CACHE_KEY_SUCCESS = 'success-confirmation-validator-'
export const CACHE_KEY_FAILED = 'failed-confirmation-validator-'
export const CACHE_KEY_EXECUTION_FAILED = 'failed-execution-validator-'

export const TRANSACTION_STATUS = {
  SUCCESS_MULTIPLE_MESSAGES: 'SUCCESS_MULTIPLE_MESSAGES',
  SUCCESS_ONE_MESSAGE: 'SUCCESS_ONE_MESSAGE',
  SUCCESS_NO_MESSAGES: 'SUCCESS_NO_MESSAGES',
  FAILED: 'FAILED',
  FOUND: 'FOUND',
  NOT_FOUND: 'NOT_FOUND',
  UNDEFINED: 'UNDEFINED'
}

export const CONFIRMATIONS_STATUS = {
  SUCCESS: 'SUCCESS',
  SUCCESS_MESSAGE_FAILED: 'SUCCESS_MESSAGE_FAILED',
  EXECUTION_FAILED: 'EXECUTION_FAILED',
  EXECUTION_PENDING: 'EXECUTION_PENDING',
  EXECUTION_WAITING: 'EXECUTION_WAITING',
  FAILED: 'FAILED',
  PENDING: 'PENDING',
  SEARCHING: 'SEARCHING',
  WAITING_VALIDATORS: 'WAITING_VALIDATORS',
  WAITING_CHAIN: 'WAITING_CHAIN',
  UNDEFINED: 'UNDEFINED'
}

export const VALIDATOR_CONFIRMATION_STATUS = {
  SUCCESS: 'Success',
  FAILED: 'Failed',
  PENDING: 'Pending',
  WAITING: 'Waiting',
  NOT_REQUIRED: 'Not required',
  UNDEFINED: 'UNDEFINED'
}

export const SEARCHING_TX = 'Searching Transaction...'

export const INCORRECT_CHAIN_ERROR = `Incorrect chain chosen. Switch to ${FOREIGN_NETWORK_NAME} in the wallet.`
