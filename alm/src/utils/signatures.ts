import Web3 from 'web3'

function strip0x(s: string) {
  return Web3.utils.isHexStrict(s) ? s.substr(2) : s
}

export interface Signature {
  v: string
  r: string
  s: string
}

export function signatureToVRS(rawSignature: string): Signature {
  const signature = strip0x(rawSignature)
  const v = signature.substr(64 * 2)
  const r = signature.substr(0, 32 * 2)
  const s = signature.substr(32 * 2, 32 * 2)
  return { v, r, s }
}

export function packSignatures(array: Array<Signature>): string {
  const length = strip0x(Web3.utils.toHex(array.length))
  const msgLength = length.length === 1 ? `0${length}` : length
  const [v, r, s] = array.reduce(([vs, rs, ss], { v, r, s }) => [vs + v, rs + r, ss + s], ['', '', ''])
  return `0x${msgLength}${v}${r}${s}`
}
