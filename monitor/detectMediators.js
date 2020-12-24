require('dotenv').config()
const logger = require('./logger')('stuckTransfers.js')
const { isHomeContract, isForeignContract } = require('./utils/web3Cache')
const eventsInfo = require('./utils/events')
const { getHomeTxSender, getForeignTxSender } = require('./utils/web3Cache')
const { addExecutionStatus } = require('./utils/message')
const { normalizeAMBMessageEvent } = require('../commons')

function countInteractions(requests) {
  const stats = {}
  requests.forEach(msg => {
    if (!stats[msg.sender]) {
      stats[msg.sender] = {}
    }
    if (!stats[msg.sender][msg.executor]) {
      stats[msg.sender][msg.executor] = 0
    }
    stats[msg.sender][msg.executor] += 1
  })
  return stats
}

const normalize = event => ({
  ...normalizeAMBMessageEvent(event),
  txHash: event.transactionHash,
  logIndex: event.transactionLogIndex
})

const flat = arrays => Array.prototype.concat.apply([], arrays)

function findPermanentMediators(homeToForeignC2C, foreignToHomeC2C) {
  return flat(
    Object.entries(homeToForeignC2C).map(([homeMediator, homeStats]) =>
      Object.entries(foreignToHomeC2C)
        .map(([foreignMediator, foreignStats]) => ({
          homeMediator,
          foreignMediator,
          homeToForeignRequests: homeStats[foreignMediator],
          foreignToHomeRequests: foreignStats[homeMediator]
        }))
        .filter(stats => stats.homeToForeignRequests && stats.foreignToHomeRequests)
    )
  )
}

function findFloatingMediators(homeToForeignC2C, foreignToHomeC2C) {
  return Object.entries(homeToForeignC2C)
    .map(([homeMediator, homeStats]) => {
      const noResponses = ([executor]) => !foreignToHomeC2C[executor] || !foreignToHomeC2C[executor][homeMediator]
      const executorRequestPairs = Object.entries(homeStats).filter(noResponses)
      return {
        mediator: homeMediator,
        executors: executorRequestPairs.map(pair => pair[0]),
        requests: executorRequestPairs.map(pair => pair[1])
      }
    })
    .filter(stats => stats.executors.length > 0)
}

function findRemotelyControlledMediators(statsU2C) {
  return Object.entries(statsU2C).map(([user, stats]) => ({
    user,
    executors: Object.keys(stats),
    requests: Object.values(stats)
  }))
}

function findUnknown(statsA2U) {
  return Object.entries(statsA2U).map(([sender, stats]) => ({
    sender,
    executors: Object.keys(stats),
    requests: Object.values(stats)
  }))
}

async function main(mode) {
  const {
    homeToForeignRequests,
    foreignToHomeRequests,
    homeToForeignConfirmations,
    foreignToHomeConfirmations
  } = await eventsInfo(mode)
  const homeToForeign = homeToForeignRequests
    .map(normalize)
    .map(addExecutionStatus(homeToForeignConfirmations))
    .filter(x => typeof x.status === 'boolean')
  const foreignToHome = foreignToHomeRequests
    .map(normalize)
    .map(addExecutionStatus(foreignToHomeConfirmations))
    .filter(x => typeof x.status === 'boolean')

  for (const event of homeToForeign) {
    // AMB contract emits a single UserRequestForSignature event for every home->foreign request.
    // If index of such event in logs is not equal to 0x0, then some other events occurred before it,
    // meaning that the sender was a contract.
    // Alternatively, the sender is a contract, if the message sender is not equal to tx.origin.
    event.isSenderAContract = event.logIndex !== '0x0' || (await getHomeTxSender(event.txHash)) !== event.sender

    // Executor is definitely a contract if a message execution failed, since message calls to EOA always succeed.
    // Alternatively, the executor is checked to be a contract by looking at its bytecode size.
    event.isExecutorAContract = !event.status || (await isForeignContract(event.executor))
  }
  for (const event of foreignToHome) {
    // AMB contract emits a single UserRequestForAffirmation event for every foreign->home request.
    // If index of such event in logs is not equal to 0x0, then some other events occurred before it,
    // meaning that the sender was a contract.
    // Alternatively, the sender is a contract, if the message sender is not equal to tx.origin.
    event.isSenderAContract = event.logIndex !== '0x0' || (await getForeignTxSender(event.txHash)) !== event.sender

    // Executor is definitely a contract if a message execution failed, since message calls to EOA always succeed.
    // Alternatively, the executor is checked to be a contract by looking at its bytecode size.
    event.isExecutorAContract = !event.status || (await isHomeContract(event.executor))
  }
  const C2C = event => event.isSenderAContract && event.isExecutorAContract
  const U2C = event => !event.isSenderAContract && event.isExecutorAContract
  const A2U = event => !event.isExecutorAContract

  const homeToForeignC2C = countInteractions(homeToForeign.filter(C2C))
  const foreignToHomeC2C = countInteractions(foreignToHome.filter(C2C))
  const homeToForeignU2C = countInteractions(homeToForeign.filter(U2C))
  const foreignToHomeU2C = countInteractions(foreignToHome.filter(U2C))
  const homeToForeignA2U = countInteractions(homeToForeign.filter(A2U))
  const foreignToHomeA2U = countInteractions(foreignToHome.filter(A2U))

  const permanentMediators = findPermanentMediators(homeToForeignC2C, foreignToHomeC2C)
  const floatingMediators = {
    home: findFloatingMediators(homeToForeignC2C, foreignToHomeC2C),
    foreign: findFloatingMediators(foreignToHomeC2C, homeToForeignC2C)
  }
  const remotelyControlledMediators = {
    home: findRemotelyControlledMediators(homeToForeignU2C),
    foreign: findRemotelyControlledMediators(foreignToHomeU2C)
  }
  const unknown = {
    home: findUnknown(homeToForeignA2U),
    foreign: findUnknown(foreignToHomeA2U)
  }

  logger.debug('Done')
  return {
    permanentMediators,
    floatingMediators,
    remotelyControlledMediators,
    unknown,
    lastChecked: Math.floor(Date.now() / 1000)
  }
}
module.exports = main
