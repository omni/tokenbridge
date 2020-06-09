// %t will be replaced by the time -> x minutes/hours/days ago
export const TRANSACTION_STATUS_DESCRIPTION: { [key: string]: string } = {
  SUCCESS_MULTIPLE_MESSAGES: 'was initiated %t and contains several bridge messages. Specify one of them:',
  SUCCESS_ONE_MESSAGE: 'was initiated %t',
  SUCCESS_NO_MESSAGES: 'execution succeeded %t but it does not contain any bridge messages',
  FAILED: 'failed %t',
  NOT_FOUND: 'was not found'
}
