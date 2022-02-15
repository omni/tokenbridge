require('dotenv').config()

const { COMMON_HOME_BRIDGE_ADDRESS, TARGET_REQUIRED_SIGNATURES, TARGET_VALIDATORS } = process.env

const fs = require('fs')
const promiseLimit = require('promise-limit')

const { web3Home } = require('../src/services/web3')
const { HOME_AMB_ABI } = require('../../commons')
const { signatureToVRS, packSignatures } = require('../src/utils/message')
const { setLogger } = require('../src/services/injectedLogger')

const mockLogger = { debug: () => {}, info: () => {}, error: () => {}, child: () => mockLogger }
setLogger(mockLogger)

const limit = promiseLimit(50)

const targetSignatures = parseInt(TARGET_REQUIRED_SIGNATURES, 10)
const targetValidators = TARGET_VALIDATORS.split(',').map(x => x.toLowerCase())

if (!targetSignatures) {
  console.log(`Invalid TARGET_REQUIRED_SIGNATURES=${TARGET_REQUIRED_SIGNATURES}`)
  process.exit(1)
}

if (targetValidators.length < targetSignatures) {
  console.log(`Invalid TARGET_VALIDATORS=${TARGET_VALIDATORS}`)
  process.exit(1)
}

const messages = {}
process.argv
  .slice(2)
  .map(f => fs.readFileSync(f))
  .flatMap(JSON.parse)
  .forEach(x => {
    if (messages[x.msgHash]) {
      messages[x.msgHash].push(x)
    } else {
      messages[x.msgHash] = [x]
    }
  })

async function main() {
  const homeBridge = new web3Home.eth.Contract(HOME_AMB_ABI, COMMON_HOME_BRIDGE_ADDRESS)

  console.log(`Overriding signatures for ${Object.keys(messages).length} AMB messages`)
  const result = await Promise.all(
    Object.values(messages)
      .map((sigs, i) => () => getMessageSignatures(homeBridge, sigs, i))
      .map(limit)
  )

  const res = {}
  result.filter(x => x).forEach(x => {
    res[x.message] = x.signatures
  })

  console.log('Writing results')
  fs.writeFileSync('./overrideSignatures.json', JSON.stringify(res))
}

async function getMessageSignatures(bridge, sigs, i) {
  if (i % 50 === 0) {
    console.log(`Processing event #${i}`)
  }
  const { msgHash, message } = sigs[0]
  const signers = []
  const signatures = []

  for (let i = 0; signatures.length < targetSignatures; i++) {
    const signature = await bridge.methods.signature(msgHash, i).call()
    if (signature === null) {
      break
    }
    const { v, r, s } = signatureToVRS(signature)
    const signer = web3Home.eth.accounts.recover(message, `0x${v}`, `0x${r}`, `0x${s}`).toLowerCase()
    if (!signers.includes(signer) && targetValidators.includes(signer)) {
      signers.push(signer)
      signatures.push(signature)
    }
  }

  if (signatures.length === targetSignatures) {
    return null
  }

  for (let i = 0; i < sigs.length; i++) {
    const signer = sigs[i].signer.toLowerCase()
    if (!signers.includes(signer) && targetValidators.includes(signer)) {
      signers.push(signer)
      signatures.push(sigs[i].signature)
    }
  }

  if (signatures.length < targetSignatures) {
    console.log(`Not enough signatures for message ${msgHash}`)
    return null
  }

  return {
    message,
    signatures: packSignatures(signatures.map(signatureToVRS))
  }
}

main()
