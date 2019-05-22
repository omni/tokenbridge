import BN from 'bignumber.js'
export const fromDecimals = (number, decimals) => {
  if (decimals == null) {
    decimals = 18
  }
  const returnValue = toBigNumber(number).dividedBy(Math.pow(10, decimals))
  return isBigNumber(number) ? returnValue : returnValue.toString(10)
}

export const toDecimals = (number, decimals) => {
  if (decimals == null) {
    decimals = 18
  }
  const returnValue = toBigNumber(number).times(Math.pow(10, decimals))
  return isBigNumber(number) ? returnValue : returnValue.toString(10)
}

const isBigNumber = object => {
  return (
    object &&
    (object instanceof BN || (object.constructor && object.constructor.name === 'BigNumber'))
  )
}

const toBigNumber = number => {
  /*jshint maxcomplexity:5 */
  number = number || 0
  if (isBigNumber(number)) return number
  if (isString(number) && (number.indexOf('0x') === 0 || number.indexOf('-0x') === 0)) {
    return new BN(number.replace('0x', ''), 16)
  }
  return new BN(number.toString(10), 10)
}

const isString = object => {
  return (
    typeof object === 'string' ||
    (object && object.constructor && object.constructor.name === 'String')
  )
}
