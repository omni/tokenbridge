// %t will be replaced by the time -> x minutes/hours/days ago
import { ALM_HOME_TO_FOREIGN_MANUAL_EXECUTION } from './constants'

export const TRANSACTION_STATUS_DESCRIPTION: { [key: string]: string } = {
  SUCCESS_MULTIPLE_MESSAGES: 'was initiated %t and contains several bridge messages. Specify one of them:',
  SUCCESS_ONE_MESSAGE: 'was initiated %t',
  SUCCESS_NO_MESSAGES:
    'successfully mined %t but it does not seem to contain any request to the bridge, \nso nothing needs to be confirmed by the validators. \nIf you are sure that the transaction should contain a request to the bridge,\ncontact to the validators by \nmessaging on %linkhttps://forum.poa.network/c/support',
  FAILED: 'failed %t',
  NOT_FOUND:
    'Transaction not found. \n1. Check that the transaction hash is correct. \n2. Wait several blocks for the transaction to be\nmined, gas price affects mining speed.'
}

export const CONFIRMATIONS_STATUS_LABEL: { [key: string]: string } = {
  SUCCESS: 'Success',
  SUCCESS_MESSAGE_FAILED: 'Success',
  FAILED: 'Failed',
  PENDING: 'Pending',
  WAITING_VALIDATORS: 'Waiting',
  SEARCHING: 'Waiting',
  WAITING_CHAIN: 'Waiting'
}

export const CONFIRMATIONS_STATUS_LABEL_HOME: { [key: string]: string } = {
  SUCCESS: 'Success',
  SUCCESS_MESSAGE_FAILED: 'Success',
  EXECUTION_FAILED: 'Execution failed',
  EXECUTION_PENDING: 'Execution pending',
  EXECUTION_WAITING: ALM_HOME_TO_FOREIGN_MANUAL_EXECUTION ? 'Manual execution waiting' : 'Execution waiting',
  FAILED: 'Confirmation Failed',
  PENDING: 'Confirmation Pending',
  WAITING_VALIDATORS: 'Confirmation Waiting',
  SEARCHING: 'Confirmation Waiting',
  WAITING_CHAIN: 'Confirmation Waiting'
}

// use %link to identify a link
export const CONFIRMATIONS_STATUS_DESCRIPTION: { [key: string]: string } = {
  SUCCESS: '',
  SUCCESS_MESSAGE_FAILED:
    'The specified transaction was included in a block,\nthe validators collected signatures and the cross-chain relay was executed correctly,\nbut the contained message execution failed.\nContact the support of the application you used to produce the transaction for the clarifications.',
  FAILED:
    'The specified transaction was included in a block,\nbut confirmations sent by a majority of validators\nfailed. The cross-chain relay request will not be\nprocessed. Contact to the validators by\nmessaging on %linkhttps://forum.poa.network/c/support',
  PENDING:
    'The specified transaction was included in a block. A\nmajority of validators sent confirmations which have\nnot yet been added to a block.',
  WAITING_VALIDATORS:
    'The specified transaction was included in a block.\nSome validators have sent confirmations, others are\nwaiting for chain finalization.\nCheck status again after a few blocks. If the issue still persists contact to the validators by messaging on %linkhttps://forum.poa.network/c/support',
  SEARCHING:
    'The specified transaction was included in a block. The app is looking for confirmations. Either\n1. Validators are waiting for chain finalization before sending their signatures.\n2. Validators are not active.\n3. The bridge was stopped.\nCheck status again after a few blocks. If the issue still persists contact to the validators by messaging on %linkhttps://forum.poa.network/c/support',
  WAITING_CHAIN:
    'The specified transaction was included in a block.\nValidators are waiting for chain finalization before\nsending their confirmations.'
}

// use %link to identify a link
export const CONFIRMATIONS_STATUS_DESCRIPTION_HOME: { [key: string]: string } = {
  SUCCESS: '',
  SUCCESS_MESSAGE_FAILED:
    'The specified transaction was included in a block,\nthe validators collected signatures and the cross-chain relay was executed correctly,\nbut the contained message execution failed.\nContact the support of the application you used to produce the transaction for the clarifications.',
  EXECUTION_FAILED:
    'The specified transaction was included in a block\nand the validators collected signatures. The\n transaction with collected signatures was\nsent but did not succeed. Contact to the validators by messaging\non %linkhttps://forum.poa.network/c/support',
  EXECUTION_PENDING:
    'The specified transaction was included in a block\nand the validators collected signatures. The\n transaction with collected signatures was\nsent but is not yet added to a block.',
  EXECUTION_WAITING: ALM_HOME_TO_FOREIGN_MANUAL_EXECUTION
    ? 'The specified transaction was included in a block\nand the validators collected signatures.\nNow the manual user action is required to complete message execution.\n Please, press the "Execute" button.'
    : 'The specified transaction was included in a block\nand the validators collected signatures. Either\n1. One of the validators is waiting for chain finalization.\n2. A validator skipped its duty to relay signatures.\n3. The execution transaction is still pending (e.g. due to the gas price spike).\nCheck status again after a few blocks or force execution by pressing the "Execute" button.\nIf the issue still persists contact to the validators by messaging on %linkhttps://forum.poa.network/c/support',
  FAILED:
    'The specified transaction was included in a block,\nbut transactions with signatures sent by a majority of\nvalidators failed. The cross-chain relay request will\nnot be processed. Contact to the validators by\nmessaging on %linkhttps://forum.poa.network/c/support',
  PENDING:
    'The specified transaction was included in a block.\nA majority of validators sent signatures which have not\nyet been added to a block.',
  WAITING_VALIDATORS:
    'The specified transaction was included in a block.\nSome validators have sent signatures, others are\nwaiting for chain finalization.\nCheck status again after a few blocks. If the issue still persists contact to the validators by messaging on %linkhttps://forum.poa.network/c/support',
  SEARCHING:
    'The specified transaction was included in a block. The app is looking for confirmations. Either\n1. Validators are waiting for chain finalization before sending their signatures.\n2. Validators are not active.\n3. The bridge was stopped.\nCheck status again after a few blocks. If the issue still persists contact to the validators by messaging on %linkhttps://forum.poa.network/c/support',
  WAITING_CHAIN:
    'The specified transaction was included in a block.\nValidators are waiting for chain finalization\nbefore sending their signatures.'
}
