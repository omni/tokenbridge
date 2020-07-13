// %t will be replaced by the time -> x minutes/hours/days ago
export const TRANSACTION_STATUS_DESCRIPTION: { [key: string]: string } = {
  SUCCESS_MULTIPLE_MESSAGES: 'was initiated %t and contains several bridge messages. Specify one of them:',
  SUCCESS_ONE_MESSAGE: 'was initiated %t',
  SUCCESS_NO_MESSAGES: 'execution succeeded %t but it does not contain any bridge messages',
  FAILED: 'failed %t',
  NOT_FOUND:
    'Transaction not found. \n1. Check that the transaction hash is correct. \n2. Wait several blocks for the transaction to be\nmined, gas price affects mining speed.'
}

export const CONFIRMATIONS_STATUS_LABEL: { [key: string]: string } = {
  SUCCESS: 'Success',
  SUCCESS_MESSAGE_FAILED: 'Success',
  EXECUTION_FAILED: 'Execution failed',
  EXECUTION_PENDING: 'Execution pending',
  EXECUTION_WAITING: 'Execution waiting',
  FAILED: 'Failed',
  PENDING: 'Pending',
  WAITING: 'Waiting'
}

// %homeChain will be replaced by the home network name
// %foreignChain will be replaced by the foreign network name
export const CONFIRMATIONS_STATUS_DESCRIPTION: { [key: string]: string } = {
  SUCCESS: '',
  SUCCESS_MESSAGE_FAILED:
    'Signatures have been collected in the %homeChain and they were successfully sent to the %foreignChain but the contained message execution failed.',
  EXECUTION_FAILED:
    'Signatures have been collected in the %homeChain and they were sent to the %foreignChain but the transaction with signatures failed',
  EXECUTION_PENDING:
    'Signatures have been collected in the %homeChain and they were sent to the %foreignChain but the transaction is in the pending state (transactions congestion or low gas price)',
  EXECUTION_WAITING: 'Execution waiting',
  FAILED:
    'Some validators sent improper transactions as so they were failed, collected confirmations are not enough to execute the relay request',
  PENDING: 'Some confirmations are in pending state',
  WAITING: 'Validators are waiting for the chain finalization'
}
