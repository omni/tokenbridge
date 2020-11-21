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

function findPermanentMediators(homeToForeignC2C, foreignToHomeC2C) {
  const res = []
  for (const homeMediator of Object.keys(homeToForeignC2C)) {
    const homeStats = homeToForeignC2C[homeMediator]

    for (const foreignMediator of Object.keys(homeStats)) {
      const foreignStats = foreignToHomeC2C[foreignMediator]

      if (foreignStats && foreignStats[homeMediator]) {
        res.push({
          homeMediator,
          foreignMediator,
          homeToForeignRequests: homeStats[foreignMediator],
          foreignToHomeRequests: foreignStats[homeMediator]
        })
      }
    }
  }
  return res
}

function findFloatingMediators(homeToForeignC2C, foreignToHomeC2C) {
  const res = []
  for (const homeMediator of Object.keys(homeToForeignC2C)) {
    const homeStats = homeToForeignC2C[homeMediator]
    for (const foreignMediator of Object.keys(homeStats)) {
      const foreignStats = foreignToHomeC2C[foreignMediator]

      let stats
      if (!foreignStats || !foreignStats[homeMediator]) {
        if (!stats) {
          stats = {
            mediator: homeMediator,
            executors: [],
            requests: []
          }
          res.push(stats)
        }
        stats.executors.push(foreignMediator)
        stats.requests.push(homeStats[foreignMediator])
      }
    }
  }
  return res
}

function findRemotelyControlledMediators(homeToForeignU2C) {
  const res = []
  for (const homeUser of Object.keys(homeToForeignU2C)) {
    const homeStats = homeToForeignU2C[homeUser]
    const stats = {
      user: homeUser,
      executors: [],
      requests: []
    }
    res.push(stats)
    for (const foreignMediator of Object.keys(homeStats)) {
      stats.executors.push(foreignMediator)
      stats.requests.push(homeStats[foreignMediator])
    }
  }
  return res
}

function findUnknown(homeToForeignA2U) {
  const res = []
  for (const homeSender of Object.keys(homeToForeignA2U)) {
    const homeStats = homeToForeignA2U[homeSender]
    const stats = {
      sender: homeSender,
      executors: [],
      requests: []
    }
    res.push(stats)
    for (const foreignMediator of Object.keys(homeStats)) {
      stats.executors.push(foreignMediator)
      stats.requests.push(homeStats[foreignMediator])
    }
  }
  return res
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
    unknown
  }
}
module.exports = main
