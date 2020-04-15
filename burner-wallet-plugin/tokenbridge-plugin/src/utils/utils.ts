export const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time))

export const constants = {
  EXCHANGE_TIMEOUT: 300000
}
