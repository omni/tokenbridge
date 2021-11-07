// workaround to avoid circular dependencies in module imports
// e.g. logger -> config -> web3 -> provider -> logger
// transforms to the following import chain
// logger -> config -> web3 -> provider -> injectedLogger
// logger -> injectedLogger

let logger

const callbacks = []

function onInjected(cb) {
  if (logger) {
    cb(logger)
  } else {
    callbacks.push(cb)
  }
}

function setLogger(newLogger) {
  logger = newLogger
  callbacks.forEach(cb => cb(logger))
}

module.exports = {
  onInjected,
  setLogger
}
