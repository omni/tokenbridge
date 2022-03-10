require('dotenv').config()

const {
  COMMON_HOME_BRIDGE_ADDRESS,
  COMMON_FOREIGN_BRIDGE_ADDRESS,
  ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY,
  ORACLE_HOME_START_BLOCK,
  ORACLE_HOME_END_BLOCK,
  ORACLE_BRIDGE_MODE
} = process.env

const fs = require('fs')
const promiseLimit = require('promise-limit')

const { web3Home, web3Foreign } = require('../src/services/web3')
const { getBridgeABIs, getPastEvents, parseAMBMessage, BRIDGE_MODES } = require('../../commons')
const { setLogger } = require('../src/services/injectedLogger')

const mockLogger = { debug: () => {}, info: () => {}, error: () => {}, child: () => mockLogger }
setLogger(mockLogger)

const limit = promiseLimit(50)

const output = process.argv[2]

async function main() {
  const { HOME_ABI, FOREIGN_ABI } = getBridgeABIs(ORACLE_BRIDGE_MODE)
  const wallet = web3Home.eth.accounts.wallet.add(ORACLE_VALIDATOR_ADDRESS_PRIVATE_KEY)
  const homeBridge = new web3Home.eth.Contract(HOME_ABI, COMMON_HOME_BRIDGE_ADDRESS)
  const foreignBridge = new web3Foreign.eth.Contract(FOREIGN_ABI, COMMON_FOREIGN_BRIDGE_ADDRESS)
  const fromBlock = parseInt(ORACLE_HOME_START_BLOCK, 10) || 0
  let toBlock = parseInt(ORACLE_HOME_END_BLOCK, 10)
  if (!toBlock) {
    toBlock = await web3Home.eth.getBlockNumber()
  }
  console.log(`Getting CollectedSignatures events from block ${fromBlock} to block ${toBlock}`)
  const events = await getPastEvents(homeBridge, { event: 'CollectedSignatures', fromBlock, toBlock })
  console.log(`Found ${events.length} CollectedSignatures events`)
  console.log('Getting messages')
  let messages = await Promise.all(
    events.map((event, i) => () => getMessage(ORACLE_BRIDGE_MODE, homeBridge, foreignBridge, event, i)).map(limit)
  )
  messages = messages.filter(x => x)
  console.log(`Filtered ${messages.length} pending messages`)
  const result = {}
  messages.forEach(msg => {
    result[msg.msgHash] = wallet.sign(msg.message).signature
  })

  console.log('Writing results')
  if (output === '-') {
    console.log(JSON.stringify(result))
  } else {
    fs.writeFileSync(output, JSON.stringify(result))
  }
}

async function getMessage(bridgeMode, homeBridge, foreignBridge, event, i) {
  if (i % 50 === 0) {
    console.log(`Processing event #${i}`)
  }
  const msgHash = event.returnValues.messageHash
  const message = await homeBridge.methods.message(msgHash).call()

  let msgId
  if (bridgeMode === BRIDGE_MODES.ARBITRARY_MESSAGE) {
    msgId = parseAMBMessage(message).messageId
  } else {
    msgId = `0x${message.slice(106, 170)}`
  }
  const alreadyProcessed = await foreignBridge.methods.relayedMessages(msgId).call()

  if (alreadyProcessed) {
    return null
  }

  return {
    msgHash,
    message
  }
}

main()
